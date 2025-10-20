const errorHandler = (err, res) => {
  if (err.status) {
    res.status(err.status).json({ message: `${err.status} - ${err.message}` });
  } else {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
};

export default errorHandler;
