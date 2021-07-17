
node init_migration.js add migration create_table_users

Run node init_migration.js up. Runs all the pending up migrations.
Run node init_migration.js down. Runs only 1 down migrations.
Run node init_migration.js refresh. Runs all down migrations followed by all up.

To run an individual migration run the below command
Example: node init_migration.js run 1593332649668_alter_table_contactus_addAutoInc up



Endo Point /messaging/gmail/send/email
Parameters sample, all fields are mandatory
{
    "Message":"Message goes here",
    "subject": "Testing compose gmail",
    "inReplyTo":"sudhaker.ssr@gmail.com",
    "references":"173a90becd5ccda0"
}

Note: references is the message id to which you want to give reply


**********************************************   **********************************************   
                                            Sequelize Info 
**********************************************   **********************************************   

https://sequelize.org/master/manual/ 

sequelize db:migrate:undo:all & sequelize db:migrate 
Above command to drop the tables and recreate the table

sequelize migration:create --name createcontactTable
Above command to create the migration for a table.





**********************************************   **********************************************   
******************************************** Swagger Docs reference links *************************   
**********************************************   **********************************************   

https://editor.swagger.io/?_ga=2.144562869.1850956774.1600171098-181580481.1600171098
https://swagger.io/docs/specification/describing-responses/
https://medium.com/wolox/documenting-a-nodejs-rest-api-with-openapi-3-swagger-5deee9f50420

