public with sharing class S3FilesHelper {
    @AuraEnabled
    public static Config getConfig(Id recordId) {

        String obj = recordId.getsobjecttype().getDescribe().getName();

        sObject sob = Database.query('SELECT Id FROM ' + obj + ' WHERE Id =: recordId LIMIT 1');

        String s3Prefix = obj + '/' + recordId;

        Amazon_S3__mdt metadata = [
            SELECT Id, 
                Bucket_Sandbox__c,
                Bucket__c,
                Access_Key_Id__c,
                Secret_Access_Key__c,
                Region__c,
                Region_Sandbox__c
            FROM Amazon_S3__mdt 
            WHERE DeveloperName = 'Amazon_S3_Integration'
        ];

        Organization org = [SELECT IsSandbox FROM Organization LIMIT 1];

        if (
            s3Prefix == null 
            || s3Prefix == ''
            || metadata.Bucket__c == null
            || metadata.Bucket__c == ''
            || metadata.Bucket_Sandbox__c == null
            || metadata.Bucket_Sandbox__c == ''
        ) {
            throw new AuraHandledException('Missing Config');
        }

        return new Config(
            metadata.Access_Key_Id__c,
            metadata.Secret_Access_Key__c,
            org.IsSandbox ? metadata.Region_Sandbox__c : metadata.Region__c,
            org.IsSandbox ? metadata.Bucket_Sandbox__c : metadata.Bucket__c,
            s3Prefix
        );
    }

    public class Config {
        @AuraEnabled
        public String accessKeyId {get;set;}
        @AuraEnabled
        public String secretAccessKey {get;set;}
        @AuraEnabled
        public String region {get;set;}
        @AuraEnabled
        public String bucket {get;set;}
        @AuraEnabled
        public String prefix {get;set;}
    
        config(
            String accessKey,
            String secretKey,
            String r,
            String b,
            String pre
        ) {
            accessKeyId = accessKey;
            secretAccessKey = secretKey;
            region = r;
            bucket = b;
            prefix  = pre;
        }
        config() {}
    }
}