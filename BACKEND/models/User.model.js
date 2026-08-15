const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    teamName:{
        type:String,
        required:true
    },
    rollNo:{
        required:true,
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:true
    }

},{timestamps:true});

const User=mongoose.model('User',userSchema);