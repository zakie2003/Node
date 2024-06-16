const express=require("express");
const app=express();
const path=require("path");
const conn=require("./connection");
const bodyParser = require("body-parser"); 
const session=require("express-session");
const alrt=require("alert");

app.set("render engine","ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret:"this is a secret",
    saveUninitialized:false,
    resave:false
}))

app.locals.authorized=false;
app.locals.user=null;
app.locals.pass=null;


// const conn=sql.createConnection({user:"root",host:"localhost",password:"2003",database:"node_cart"})

function login_check(req,res,next){
    let query=`select * from user where userid='${req.body.uid}' and password='${req.body.pass}'`
    conn.query(query, (err, results, fields) => {
        if (err) {
            res.render("./index.ejs",{msg:"Incorrect Input"});
        }
        else{
            if(results.length>0){
                req.session.authorized=true;
                req.session.user=results[0].userid;
                req.session.pass=results[0].password;
                req.session.email=results[0].email;
                req.session.number=results[0].phone_num;

                app.locals.authorized=true;
                app.locals.user=results[0].userid;
                app.locals.pass=results[0].password;
                app.locals.email=results[0].email;
                app.locals.number=results[0].phone_num;
                next();
            }
            else{
                res.render("./index.ejs",{msg:"Bad Credentials"});
            }
        }
      });
}

function signup_check(req,res,next){
    let query=`select * from user where userid='${req.body.uid}'`
    conn.query(query, (err, results, fields) => {
        if (err) {
          console.error('Error executing query: ', err);
          return;
        }
        else{
            if(results.length==0){
                next();
            }
            else{
                res.render("signup.ejs",{err:"Account Already Exist"});
            }
        }
      });
}

function genrate_orderid(user){
    const date=new Date;
    const time=user+""+date.getDate()+date.getMonth()+date.getFullYear()+date.getHours()+date.getMinutes()+date.getSeconds();
    console.log(time);
    return time;
}

app.get("/",(req,res)=>{
    res.render("index.ejs",{msg:null});
})

app.get("/signup",(req,res)=>{
    res.render("signup.ejs",{err:null});
})

app.get("/products",(req,res)=>{
    res.render("product.ejs");
})

app.post("/signup",signup_check,(req,res)=>{
    let query=`insert into user values('${req.body.uid}','${req.body.pass}',NULL,NULL);`;
    conn.execute(query);
    res.render("signup.ejs",{err:"Success"});
})

app.post("/login",login_check,(req,res)=>{
    res.redirect("/products");
})

app.get("/logout",(req,res)=>{
    if(req.session.authorized){
        req.session.authorized=false;
        req.session.user=null;
        req.session.pass=null;

        app.locals.authorized=false;
        app.locals.user=null;
        app.locals.pass=null;
        app.locals.email=null;
        app.locals.number=null;
        res.redirect("/");
    }
})

app.get("/clear",(req,res)=>{
    if(req.session.authorized){
        let query=`delete from cart where user='${req.session.user}'`
        conn.execute(query);
        res.redirect("/cart");
    }
    else{
        res.redirect("/");
    }
})

app.get("/cart",(req,res)=>{
    if(req.session.authorized){
        let query=`select * from cart where user='${req.session.user}'`;
        conn.query(query, (err, results, fields) => {
            if (err) {
              console.error('Error executing query: ', err);
              return;
            }
            else{
                
                res.render("cart.ejs",{results})
            }})

    }
    else{
        res.redirect("/");
    }
})


app.get("/checkout",(req,res)=>{
    if(req.session.authorized){
        let date=new Date();
        let time=date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate();
        let query=`select * from cart where user='${req.session.user}'`;
        conn.execute(query,(err,result,fields)=>{
            result.forEach((i)=>{
                const query=`insert into orders values('${i.order_id}','${i.prod_id}','${i.quantity}',${i.price},'${i.prod_name}','${i.user}','${time}');`;
                conn.execute(query);
            })
        })
        res.redirect("/clear");
    }
})

app.get("/profile",(req,res)=>{
   if(req.session.authorized){
    let query=`select * from orders where user='${req.session.user}'`;
    conn.execute(query,(err,result,fields)=>{
        res.render("profile.ejs",{result})
    })
   }
   else{
    res.redirect("/");
   }
})

app.post("/additem",(req,res)=>{
    if(req.session.authorized){
        const item_check=`select * from cart where prod_id='${req.body.prod_id}' and user='${req.session.user}';`;
        conn.execute(item_check,(err,result,fields)=>{
            if(result.length===0 && req.body.quantity>0){
                const order_id=genrate_orderid(req.session.user);
                const query=`insert into cart values('${order_id}','${req.body.prod_id}','${req.body.quantity}',${req.body.price},'${req.body.name}','${req.session.user}');`;
                conn.execute(query);
            }
            else{
                const query=`update cart set quantity=${req.body.quantity} where user='${req.session.user}' and prod_id='${req.body.prod_id}'`;
                conn.execute(query);
            }
            res.redirect("/products");
        })

    }
    else{
        res.redirect("/");
    }
})

app.get("/edit",(req,res)=>{
    if(req.session.authorized){
        res.render("edit.ejs");
    }
    else{
        res.redirect("/");
    }
})

app.post("/update",(req,res)=>{

    if(req.session.authorized){
        const item_check=`select * from user where userid='${req.body.uid}';`;
        conn.execute(item_check,(err,result,fields)=>{
            console.log(result);
            if(result.length===0){
                const query=`update user set userid='${req.body.uid}',phone_num='${req.body.phone}',email='${req.body.email}',password='${req.body.pass}' where userid='${req.session.user}'`;
                const ordr_query=`update orders set user='${req.body.uid}' where user='${req.session.user}'`;
                const cart_query=`update cart set user='${req.body.uid}' where user='${req.session.user}'`;
                conn.execute(query);
                conn.execute(ordr_query);
                conn.execute(cart_query);
                req.session.user=req.body.uid;
                req.session.pass=req.body.pass;
                app.locals.user=req.body.uid;
                app.locals.pass=req.body.pass;
                app.locals.email=req.body.email;
                app.locals.number=req.body.phone;
            }
            else{
                res.redirect("/profile");
            }
            res.redirect("/profile");
        })

    }
    else{
        res.redirect("/");
    }

})

app.get("/updatequantity",(req,res)=>{
    if(req.session.authorized){
        if(req.query.act==="increase"){
            let query=`update cart set quantity=quantity+1 where prod_id='${req.query.pid}' and user='${req.session.user}';`;
            conn.execute(query);
            res.redirect("/cart");
        }
        else if(req.query.act==="decrease"){
            let query=`update cart set quantity=quantity-1 where prod_id='${req.query.pid}' and user='${req.session.user}';`;
            conn.execute(query);
            query=`delete from cart where quantity=0;`
            conn.execute(query);
            res.redirect("/cart");
        }
    }
})

app.listen(3000,()=>{
    console.log("Server Running");
})