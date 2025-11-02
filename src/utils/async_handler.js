
/* const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
} 
 */
export {asyncHandler}

//fn->(usually your route/controller).
//asyncHandler is a wrapper fn ie u now need not write try catch multiple times
//use this directly when needed

const asyncHandler=(fn)=> async(req,res,next)=>{
    try{
        await fn(req,res,next)// executes your actual route/controller function
    }
    catch(error){
        res.status(error.code||500).json({
            success:false,
            message:error.message
        })
    }
}