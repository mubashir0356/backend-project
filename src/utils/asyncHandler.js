// asyncHandler using Promise

const asyncHandler = (regularHandler) => {
    return (req, res, next) => {
        Promise.resolve(regularHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asyncHandler }

/* asyncHandler using async and await with try and catch 

const asyncHandler = (regularHandler) => async(req, res, next) => {
    try {
        await regularHandler(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            status: false,
            message: error.message
        })
    }
} 
*/

