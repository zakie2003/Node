require("dotenv").config();
const sql=require("mysql2");
const conn=sql.createConnection({user:'sql12735445',host:'sql12.freesqldatabase.com',password:'uKRC1ax65n',database:'sql12735445'})

module.exports=conn;