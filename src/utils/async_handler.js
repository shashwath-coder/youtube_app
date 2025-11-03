
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
//so you use async handler(higher order fn) to which u pass the fn u want to perform and then put the try catch in this async handler instead of in the func where u want to perform the try catch

const asyncHandler=(fn)=> async(req,res,next)=>{
    try{
        return await fn(req,res,next)// executes your actual route/controller function
    }
    catch(error){
        res.status(error.code||500).json({
            success:false,
            message:error.message
        })
    }
}