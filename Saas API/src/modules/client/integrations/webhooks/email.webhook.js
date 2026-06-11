exports.receiveWebhook = async (
  req,
  res
) => {
  console.log(
    "Email Event:",
    JSON.stringify(req.body, null, 2)
  );

  res.status(200).json({
    success: true,
  });
};