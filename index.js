'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

const SPREE_HOST = process.env.SPREE_HOST;
const SPREE_UK_HOST = process.env.SPREE_UK_HOST;
const SPREE_API_KEY = process.env.SPREE_API_KEY;

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, function(err, data){
        if (err) {
            console.log(err);
            const message = 'Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.';
            console.log(message);
            callback(message);
        }
        else {

            // set the metatData and expiring
            if(data.Metadata && data.Metadata.processed)
            {
                console.log('file processed, skip now');
            }
            else{
                //post to spree
                const currentData = data.Body.toString().split(/(?:\r\n|\r|\n)/g);
                if (currentData && currentData.length) {
                    const orders=[];
                    const orders_uk=[]
                    for (var line = 0; line < currentData.length; line++) {
                        console.log('read line: ',currentData[line]);
                        const line_data=currentData[line];
                        if (line_data.indexOf("SalesOrderNumber")>-1 || line_data.indexOf("DespatchTrackingNumber")>-1 || line_data.indexOf("---")>-1  || line_data.indexOf("Content")>-1 || line_data.length<3 )
                        {
                            // the header
                        }
                        else{
                            // the tracking data
                            const rds=line_data.split(',');
                            const order_id=rds[0];
                            const tracking_number=rds[1];
                            const service = rds[2];
                            const shipment= {
                                id:order_id,
                             trackingnumber:tracking_number,
                            carrier_id:6
                        };
                           // console.log('parsed tracking: ', order_id + ' : ' + tracking_number + ' : ' + service);
                            if (order_id[0]=='4')
                              orders_uk.push(shipment);
                            else
                              orders.push(shipment);
                        }
                    }
                    // post to spree
                    if (orders.length>0)
                      post_spree(SPREE_HOST, orders);

                    if (orders_uk.length>0)
                        post_spree(SPREE_UK_HOST, orders_uk);
                }


                // done

                data.Metadata.processed = 'y';
    
                s3.putObject({
                    Bucket: bucket,
                    Key: key,
                    Body: data.Body,
                    Metadata: data.Metadata
                }, function(err) {
                    if(err) 
                      console.log('error:', err.toString);

                    console.log('File processed and marked as processed', key);
                });
                //done
            }
            
            callback(null, data.ContentType);
        }
    });
};

function post_spree(host, orders)
{
    //const host= host; //'staging.naturalwellbeing.com';
    const endpoint= '/api/shipments/batch_mark_shipped';
    const apiKey = SPREE_API_KEY;

    const https = require('https');
    const dataString = JSON.stringify({'shipments':orders});
    console.log('the orders json: ',dataString);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString, 'utf8'),
        'Accept': 'application/json',
        'X-SpreeAPIKey': apiKey
    };
    var options = {
        host: host,
        path: endpoint,
        method: 'PUT',
        headers: headers
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            console.log(responseString);
            //var responseObject = JSON.parse(responseString);
            //success(responseObject);
            console.log('posted to server done: ',host);

        });
    });

    req.write(dataString);
    req.end();
    // post done
}
