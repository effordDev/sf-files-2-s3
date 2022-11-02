# Salesforce Files to Amazon S3
## Setup

### 1. Create New Bucket in S3
Choose the appropriate region for you:

![image](https://user-images.githubusercontent.com/36901822/199581016-b505e23a-d858-4678-8e28-934bd22806d9.png)

Make sure ACLs disabled is ```true```

![image](https://user-images.githubusercontent.com/36901822/199581234-4bbe0b03-d568-4e03-b027-4efc61a7663d.png)

Block all public access is ```true```

![image](https://user-images.githubusercontent.com/36901822/199581489-9a9a5545-ba5d-432c-ae27-a9d7361db2e9.png)

Once created, navigate to your new created bucket. Go to the permissions tab and copy the below code into the 'Cross-origin resource sharing (CORS)' settings:

```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "DELETE"
        ],
        "AllowedOrigins": [
            "https://reidsdevorg2-dev-ed.lightning.force.com"
        ],
        "ExposeHeaders": [
            "Access-Control-Allow-Origin"
        ]
    }
]
```

In the search bar navigate to IAM. Select 'Users' on the left side of the menu. Select 'Add users'.

Name your user (recommend putting salesforce in the name) and select 'Access key - Programmatic access' for the credential type.

![image](https://user-images.githubusercontent.com/36901822/199584111-9fca6e9a-7d8f-4922-b681-6eb02701eef5.png)

Select 'Next: Permissions' and 'Attach existing policies directly', search for 'AmazonS3FullAccess' and check that policy. Select 'Next: Tags', Select 'Create user'.


> **Warning**
> BE SURE TO COPY THE ```ACCESS KEY ID``` AND THE ```SECRET ACCESS KEY``` BEFORE CLOSING THIS PAGE.


### 2. Custom Metadata Configuration
In Salesforce, ```Setup > Custom Code > Custom Metadata Types > Amazon S3```
Select 'Manage Amazon S3's' 
Create a new Amazon_S3__mdt record named ```Amazon_S3_Integration```
![image](https://user-images.githubusercontent.com/36901822/199586650-ff02ab50-8534-4f22-bd78-ee17c9282a11.png)

Fill out the information in the record from S3. Create a Bucket for sandbox testing, just be sure put 'sandbox' in the name to differenciate.  
![image](https://user-images.githubusercontent.com/36901822/199580647-24fc999c-3b41-4b9a-8bd6-80ae1a4904ca.png)

Navigate to Lightning page and search 'Amazon s3 Files', drag component to page and configure as needed.

https://user-images.githubusercontent.com/36901822/199588592-7c3e5d58-1ee8-4b36-ab3e-c83c9fe133a5.mov


![image](https://user-images.githubusercontent.com/36901822/199579670-c696e7d8-bcce-4d1c-a1f9-dea26e63733f.png)


