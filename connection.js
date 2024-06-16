require("dotenv").config();
const sql=require("mysql2");
const conn=sql.createConnection({user:process.env.USER,host:process.env.HOST,password:process.env.PASSWORD,database:process.env.DATABASE})

module.exports=conn;