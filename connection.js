require("dotenv").config();
const sql=require("mysql2");
const conn=sql.createConnection({user:'root',host:'localhost',password:'2003',database:'shopping'})

module.exports=conn;