// @ts-nocheck
const errorHandler = (err, req, res, next) => {
  console.error(err);
 res.status(500).json({
    message: err.message || "Erreur serveur",
    debug: {
      message: err.message,
      name: err.name,
      stack: err.stack,
    },
  });
};

export default errorHandler;
