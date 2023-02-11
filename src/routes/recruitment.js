const router = require("express").Router();
const maindb = require("../../getdata");
const Discord = require("discord.js");

router.get("/recruitment/ccc", (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const { user } = req;
    if (req.isAuthenticated()) {
        return res.send("Recruitment is currently not active");
        
        const userData = maindb.get(String(user))
        res.render("ccc.ejs", { loggedIn: req.isAuthenticated(), data: userData })
    } else {
        res.redirect("/login?redirect=recruitment/ccc");
    }
})

router.post("/recruitment/ccc", async (req, res) => {
    const { username, userID, discord, age, playtime, english, why } = req.body;

    const userData = maindb.get(String(userID));
    if (!userData) {
        return res.send({ error: true, success: false, message: "User not found in the database" });
    }

    const embed = new Discord.MessageEmbed()
        .setColor("#f16432")
        .setAuthor({ name: String(username), url: `https://www.convoyhub.in/profile/${userID}`, iconURL: String(userData.avatar) })
        .setTitle("Application for CC Car")
        .setURL(`https://www.convoyhub.in/profile/${userID}`)
        .setDescription(String(why))
        .addField("Discord", String(discord), true)
        .addField("Age", String(age), true)
        .addField("Playtime", String(playtime), true)
        .addField("Can speak Basic English?", String(english), true)
        .addField("E-Mail", String(userData.email), true)
        .addField("Country", String(userData.country), true)
        .addField("Games", String(userData.games), true)
        .setTimestamp()

    const webhook = new Discord.WebhookClient({ url: "https://discord.com/api/webhooks/988377199180673024/1rGjXZVNa7Ku7BzIGafwuPrF5cnkMYmWvH6MpoXFVrZpOuCXNPmEoakBcb8N7cowqka7" });

    await webhook.edit({
        name: "CC Car Recruitment",
        avatar: "https://www.convoyhub.in/images/apple-touch-icon-144x144.png"
    })
    webhook.send({ embeds: [embed] }).catch();

    res.send({ error: false, success: true, message: "Application Sent Successfully" });
})

router.get("/recruitment/cct", (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const { user } = req;
    if (req.isAuthenticated()) {
        const userData = maindb.get(String(user))
        res.render("cct.ejs", { loggedIn: req.isAuthenticated(), data: userData })
    } else {
        res.redirect("/login?redirect=recruitment/cct");
    }
})

router.post("/recruitment/cct", async (req, res) => {
    const { username, userID, discord, age, playtime, english, why } = req.body;

    const userData = maindb.get(String(userID));
    if (!userData) {
        return res.send({ error: true, success: false, message: "User not found in the database" });
    }

    const embed = new Discord.MessageEmbed()
        .setColor("#f16432")
        .setAuthor({ name: String(username), url: `https://www.convoyhub.in/profile/${userID}`, iconURL: String(userData.avatar) })
        .setTitle("Application for CC Truck")
        .setURL(`https://www.convoyhub.in/profile/${userID}`)
        .setDescription(String(why))
        .addField("Discord", String(discord), true)
        .addField("Age", String(age), true)
        .addField("Playtime", String(playtime), true)
        .addField("Can speak Basic English?", String(english), true)
        .addField("E-Mail", String(userData.email), true)
        .addField("Country", String(userData.country), true)
        .addField("Games", String(userData.games), true)
        .setTimestamp()

    const webhook = new Discord.WebhookClient({ url: "https://discord.com/api/webhooks/988377199180673024/1rGjXZVNa7Ku7BzIGafwuPrF5cnkMYmWvH6MpoXFVrZpOuCXNPmEoakBcb8N7cowqka7" });

    await webhook.edit({
        name: "CC Truck Recruitment",
        avatar: "https://www.convoyhub.in/images/apple-touch-icon-144x144.png"
    })
    webhook.send({ embeds: [embed] }).catch();

    res.send({ error: false, success: true, message: "Application Sent Successfully" });
})

module.exports = router;