import { api, LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import AWS_SDK from '@salesforce/resourceUrl/aws';

import getConfig from "@salesforce/apex/S3FilesHelper.getConfig";

const TIMELIMIT = 60 //seconds

export default class AmazonS3Files extends LightningElement {
     @api recordId
     @api allowUploads = false
     @api allowView = false
     @api allowDownload = false
     @api allowDelete = false
     
     config = {}
     files = []
     
     progress = 0
     isLoading = false 

     async connectedCallback() {
          try {

               if (this.init) {
                   return
               }
               this.init = true;
               
               //load sdk
               await Promise.all([
                    loadScript(this, AWS_SDK),
               ])

               this.config = await getConfig({ recordId: this.recordId })
                   
               //start sdk
               this.loadSDK()
          } catch (error) {
               console.warn(error)
          }
     }

     get awsConfig() {
          return {
               accessKeyId: this.config?.accessKeyId,
               secretAccessKey: this.config?.secretAccessKey,
               region: this.config?.region
          }
     }

     get params() {
          return {
               Bucket: this.config.bucket,
               Prefix: this.config.prefix
          }
     }
     
     get disable() {
          return !!this.progress
     }

     loadSDK() {

          this.AWS = AWS

          this.AWS.config.update(this.awsConfig)

          this.listS3Objects()
     }

     listS3Objects() {

          try {
               this.loading()

               const s3 = new this.AWS.S3()
               const params = {
                    Prefix: this.config?.prefix,   
                    Bucket: this.config?.bucket,                
               }
     
               s3.listObjects(params, (err, data) => {
                    if (err) {
                         console.log("Error", err)
                    } else {
                         console.log("Success", data)
                         this.files = data.Contents.filter(item => item.Size > 0).map(item => {
                              //filter out folder and prefix from name
                              item.name = item.Key.substring(item.Key.lastIndexOf('/') + 1)
                              return item
                         })
                    }
               })
          } catch (error) {

               console.error(error)

          } finally {
               this.loading()
          }

     }  
     
     /**
      * @param {key} file path 
      * @returns url
      * @description handles getting signed url for viwing file
     */
     getFileURL(key) {

          try {

               this.loading()

               const s3 = new this.AWS.S3()
     
               const params = {
                    Bucket: this.config?.bucket, 
                    Expires: TIMELIMIT,
                    Key: key
               }
     
               const url = s3.getSignedUrl('getObject', params)
              
               return url
          } catch (error) {

               console.log(error)

          } finally {
               this.loading()
          }
     }
     
     /**
      * 
      * @param {event}  
      * @returns undefined
      * @description opens window for signed file url
     */
     view(event) {

          const key = event.target.dataset.key

          const url = this.getFileURL(key)

          window.open(url)
     }

     /**
      * @param {event}  
      * @returns undefined
      * @description gets signed file url, creates <a>
      * and clicks
     */
     async download(event) {

          try {
               this.loading()

               const key = event.target.dataset.key
               const name = event.target.dataset.name

               const url = this.getFileURL(key)

               const response = await fetch(url)
               const buff = await response.arrayBuffer()

               const blob = new Blob([buff], {type: 'application/octet-stream'})

               const blobUrl = URL.createObjectURL(blob)

               const link = document.createElement("a")
               
               link.setAttribute("type", "hidden")
               link.href = blobUrl
               link.download = name

               document.body.appendChild(link)

               link.click()
               link.remove()
          } catch (error) {

               console.log(error)

          } finally {
               this.loading()
          }
     }
     
     /**
      * @param {event}  
      * @returns undefined
      * @description handles uploading files array
     */
     async upload(event) {
          
          const files = event.target.files

          try {
            
               for (let i = 0; i < files.length; i++){
                   
                    // eslint-disable-next-line no-await-in-loop
                    await this.uploadFile( files[i] )
               }

               setTimeout(() => this.listS3Objects(), 1000)

               this.toast()
          } catch (error){
               // eslint-disable-next-line no-console
               console.error( error )
          }

     }
      
     /** 
      * @param {file} data 
      * @returns new Promise
      * @description handles uploading the file
     */
     uploadFile(data) {

          const Key = `${this.config.prefix}/${data.name}`

          const params = {
               Bucket: this.config?.bucket,
               Key,
               ContentType: data.type,
               Body: data,
               ACL: 'private' // set based on AWS S3
          }

          const opts = {
               queueSize: 1,
               partSize: 1024 * 1024 * 10
          }

          const bucket = new this.AWS.S3({ params: this.awsConfig })

          return new Promise((resolve, reject) => {

               try {
                    bucket.putObject(params, opts, (error, data) => {
                         
                         if (error) {
                              // eslint-disable-next-line no-console
                              console.error(error)
                         } else {
                              console.log(data)
                         } 

                    })
                    .on('httpUploadProgress', num => {
                         
                         this.progress = Math.round(num.loaded / num.total * 100)
                         
                         if (this.progress === 100){

                              this.progress = 0
                              resolve(this.progress)
                         }
                    })
               } catch (error){
                    // eslint-disable-next-line no-console
                    console.error( error )
                    reject( error )
               }
          })
     }
     
     /** 
      * @param {event}  
      * @returns undefined
      * @description handles removing file
     */
     async remove(event) {

          const key = event.target.dataset.key
          
          try {

               await this.removeFile(key)
               
               setTimeout(() => this.listS3Objects(), 1000)
               
               this.toast()
          } catch (error) {
               console.error(error)
          }
     }
     
     /** 
      * @param {key} file path
      * @returns new Promise
      * @description deletes object from key file path
     */
     removeFile(key) {
          
          const params = {
               Bucket: this.config?.bucket,
               Key: key,
          }

          const bucket = new this.AWS.S3({ params: this.awsConfig })

          return new Promise((resolve, reject) => {

               bucket.deleteObject(params, (err, data) => {
                    if (err) {
                         console.log(err, err.stack)
                         reject(err)
                    } else {
                         resolve(data)           
                    }    
               })
          })
     }

     toast(title = 'Success', message = '', variant = 'success') {
          this.dispatchEvent(
               new ShowToastEvent({
                    title,
                    message,
                    variant
               })
          )
     }

     loading() {
          this.isLoading = this.isLoading ? false : true
     }
}
