const express = require('express') ;
const path = require('path');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const { hash } = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');



app.use(cookieParser());
app.set("view engine" , "ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true})) ;
app.use(express.static(path.join(__dirname,"public")))


app.get("/",(req,res)=>{
    res.render("index");
})
app.post("/register",(req,res)=>{
    let {name,email,password,age} = req.body ;
    bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt, async (err,hash)=>{
        let user =await userModel.create({
            name,
            email,
            password : hash ,
            age,
        })
        let token =  jwt.sign(email,"secret")
        res.cookie("token",token);
        res.send("Done")
    })
})   
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/logout",(req,res)=>{
    res.cookie("token","") ;
    res.redirect("/login");
})
app.post("/login",async (req,res)=>{
    let {email,password} = req.body ;
    let user = await userModel.findOne({email});
    if(!user) return res.send("Something went wrong");
    if(user){
        bcrypt.compare(password,user.password,(err,result)=>{
            if(!result) return res.send("Something went wrong")
            else{
               let token = jwt.sign(user.email,"secret")
               res.cookie("token",token);
               res.send("Working");
            }     
        });
    }
})
app.get("/profile",isLoggedIn ,async (req,res)=>{
    let user = await userModel.findOne({email:req.user}).populate("posts")
    // console.log(user);
 res.render("profile",{user});
 })
 app.post("/post",isLoggedIn ,async (req,res)=>{
    let user = await userModel.findOne({email: req.user});
    let {content} = req.body;
    let post = await postModel.create({
        user : user._id,
        content,
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
 })
function isLoggedIn(req,res,next){
  if(req.cookies.token === "") res.send("You have to login first") 
    else{
      let data = jwt.verify(req.cookies.token,"secret")
      req.user = data
    }
    next();
}
app.listen(3000)