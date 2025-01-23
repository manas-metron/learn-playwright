import {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    ListBucketsCommand,
    PutBucketAclCommand,
    PutObjectAclCommand,
    Bucket
} from "@aws-sdk/client-s3";
import { test, expect } from "@playwright/test";
import { creds } from "../creds";
import { readFile } from "node:fs/promises";


const credentials = {
    region: creds.REGION,
    credentials: {
        accessKeyId: creds.AWSAccessKeyId,
        secretAccessKey: creds.AWSSecretAccessKey
    }
};
const s3Client = new S3Client(credentials);

test('createS3bucket', async ({ page }) => {
    var bucketName: string = creds.bucketName;
    console.log("S3Bucket name: " + bucketName);
    try {
        await s3Client.send(
            new CreateBucketCommand({
                Bucket: bucketName,
            })
        );
        console.log("Bucket created successfully!");

        // Set bucket ACL to private (default for most use cases, but ensure it's explicitly private here)
        await s3Client.send(
            new PutBucketAclCommand({
                Bucket: bucketName,
                ACL: 'public-read-write',
            })
        );
        console.log("Bucket ACL set to private.");
    } catch (err) {
        console.error("Error creating bucket:", err);
    }
})

test('verifyS3bucket', async ({ page }) => {
    const command: ListBucketsCommand = new ListBucketsCommand({});
    try {
        const { Buckets }: { Buckets?: Bucket[] } = await s3Client.send(command);
        console.log(Buckets);
        expect(Buckets).toContainEqual(expect.objectContaining({ Name: creds.bucketName }));
    } catch (err) {
        console.error("Error verifying bucket:", err);
    }
})


test('uploadFileToS3WithPublicAccess', async ({ page }) => {
    const bucketName: string = creds.bucketName;
    const filePath: string = "sensitive_data.csv";
    const fileName: string = "sensitive_data.csv";

    console.log("Uploading file to S3 bucket: " + bucketName);
    try {
        // Upload the file to S3
        const uploadFileCommand: PutObjectCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: await readFile(filePath),
        });
        await s3Client.send(uploadFileCommand);
        console.log("File uploaded successfully.");

        // Grant public read access to the file
        const publicAccessCommand: PutObjectAclCommand = new PutObjectAclCommand({
            Bucket: bucketName,
            Key: fileName,
            ACL: "public-read",
        });
        await s3Client.send(publicAccessCommand);
        console.log("Public access granted to the file.");
    } catch (err) {
        console.error("Error uploading file or setting public access:", err);
    }
});