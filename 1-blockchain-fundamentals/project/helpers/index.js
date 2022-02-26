const getTimeUTC = () => new Date().getTime().toString().slice(0, -3);

exports.getTimeUTC = getTimeUTC;
