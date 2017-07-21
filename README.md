# Spree shipping update from warehouse at Avenue85

## Function
This is one lambda function, will be triggered by AWS S3 upload event. Once a file is uploaded, this lambda will read the file, parse the content,
and post to spree commerce host.
Three environment variables need be configured in lambda.
SPREE_HOST : host of spree
SPREE_UK_HOST : host of spree uk
SPREE_API_KEY : the api key in spree

# fork notice
if you want use this code for your own site, probably need update file parsing and the order posting sections to work with your business.

## Setup

 * Clone this repo

 * Run `npm install`

 * zip all file

 * upload as one zip file into your created lambda funtction

 * configure the trigger to listen to your S3 bucket upload.


[l]: https://aws.amazon.com/lambda/
[s3-evt-setup]: http://docs.aws.amazon.com/AmazonS3/latest/UG/SettingBucketNotifications.html
