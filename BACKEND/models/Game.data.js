const mongoose=require('mongoose');

const gameDataSchema=new mongoose.Schema({
    teamId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    startedAt:{
        type:Date,
    },
    endedAt:{
        type:Date,
    },
    hintsUsed:{
        
    }
})