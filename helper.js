const createErrorObj = (message, code) => {
  const obj = new Error(message);
  obj.statusCode = code;
  return obj;
};

module.exports = { createErrorObj };
