// Envuelve un controller async para que cualquier promesa rechazada llegue
// al error handler central sin try/catch explícito. Express 5 ya propaga
// rejections, pero el wrapper lo hace homogéneo y explícito en cada ruta.
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
