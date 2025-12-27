module.exports.dealerProfile = async function dealerProfile(req, res) {
    return res.status(200).json({ message: "Dealer profile accessed successfully", dealerId: req.dealer.id });
}