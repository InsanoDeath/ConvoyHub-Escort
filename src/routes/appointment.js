const router = require("express").Router();
const maindb = require("../../getdata");
const Discord = require("discord.js");
const config = require("../../config.json");
const fetch = require("node-fetch");

router.get("/appointment", (req, res, next) => {
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
        const events = maindb.get("events") || [];
        const filteredEvents = events.filter(f => Date.parse(f.start_at) >= Date.now() && f.organiser && f.organiser.id == (userData.manager || userData.TMPID) && f.escortRequested);

        res.render("appointment.ejs", { loggedIn: req.isAuthenticated(), data: userData, events: filteredEvents })
    } else {
        res.redirect("/login?redirect=appointment");
    }
})

router.post("/appointment", async (req, res, next) => {
    const { event, message, userID } = req.body;

    const events = maindb.get("events") || [];
    const filteredEvent = events.find(f => f.eventID == event);
    const otherEvent = events.filter(f => f.eventID != event);

    if (!filteredEvent) {
        return res.send({ error: true, success: false, message: "Event Not Found" })
    }

    let user = !userID ? req.user : userID;

    const userData = maindb.get(String(user));

    let appointmentID = maindb.get("appointmentID") || 0;
    const currID = ++appointmentID;
    maindb.set("appointmentID", currID);

    const data = {
        userID: userData?.userID,
        username: userData?.username,
        id: filteredEvent.id,
        name: filteredEvent.name,
        eventID: filteredEvent.eventID,
        organiser: filteredEvent.organiser,
        message: message,
        status: "new",
        claimedBy: "N/A",
        time: Date.now(),
        lastUpdated: Date.now(),
        appointmentID: currID
    }
    maindb.push("appointments", data);

    filteredEvent.escortRequested = true;
    filteredEvent.escortBooked = false;
    otherEvent.push(filteredEvent);
    maindb.set("events", otherEvent)

    const embed = new Discord.MessageEmbed()
        .setColor("#388f53")
        .setTitle(filteredEvent.name)
        .addField("Organiser", filteredEvent.organiser.name, true)
        .addField("Booked By", `${userData?.username} (${userData?.userID})`, true)
        .addField("Event URL", `${config.convoyhuburl}event/${event}`, false)
        .addField("Appointment URL", `${config.url}appointments/${appointmentID}`, false)
        .setDescription(message)
        .setURL(`${config.url}appointments/${appointmentID}`)
        .setImage(filteredEvent.banner)
        .setTimestamp()

    const webhook = new Discord.WebhookClient({ url: "https://discord.com/api/webhooks/987685945354637433/m1O1TBBFuu5bHlLtl94UoMKQQHFQ5MDyLyj3BaDx2KjVAgTmQ2ZHCpwjjGDUazEDgGkX" });

    await webhook.edit({
        name: "Appointment Requester",
        avatar: "https://www.convoyhub.in/images/apple-touch-icon-144x144.png"
    })
    webhook.send({ embeds: [embed] }).catch();

    res.send({ error: false, success: true, message: "Appointment Sent Successfully" })
})

router.get("/appointments", (req, res) => {
    res.sendStatus(200);
})

router.get("/appointments/:appointmentID", (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const { appointmentID } = req.params;
    const appointments = maindb.get("appointments") || [];
    const filteredApp = appointments.find(f => f.appointmentID == appointmentID);

    if (!filteredApp) {
        const error = new Error("Appointment ID not Found.")
        error.status = 404;
        return next(error)
    }

    const { user } = req;
    if (req.isAuthenticated()) {
        const userData = maindb.get(String(user))
        res.render("eachappointment.ejs", { loggedIn: req.isAuthenticated(), data: userData, app: filteredApp })
    } else {
        res.redirect("/login?redirect=appointments/" + appointmentID);
    }
})

router.post("/appointments/:appointmentID", async (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const { status, claimedBy, claimedByID } = req.body;

    const { appointmentID } = req.params;
    const { user } = req;

    const appointments = maindb.get("appointments") || [];
    const filteredApp = appointments.find(f => f.appointmentID == appointmentID);
    const otherApp = appointments.filter(f => f.appointmentID != appointmentID);

    if (!filteredApp) {
        return res.send({ error: true, success: false, message: "Appointment ID not Found." });
    }

    try {
        if (req.isAuthenticated()) {
            const userData = maindb.get(String(user))
            if (userData.isStaff) {
                filteredApp.status = status;
                filteredApp.claimedBy = claimedBy;
                filteredApp.claimedByID = claimedByID;

                const events = maindb.get("events") || [];
                const filteredEvent = events.find(f => f.eventID == filteredApp.eventID);
                const otherEvent = events.filter(f => f.eventID != filteredApp.eventID);

                if (!filteredEvent) {
                    return res.send({ error: true, success: false, message: "Event Not Found" })
                }
                filteredEvent.escortRequested = true;
                if (status == "accept") {
                    filteredEvent.escortBooked = true;
                } else {
                    filteredEvent.escortBooked = false;
                }
                otherEvent.push(filteredEvent);
                maindb.set("events", otherEvent)

                if (filteredApp.channel && filteredApp.messageID) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#f16432")
                        .setTitle(filteredApp.name)
                        .setURL(`${config.convoyhuburl}event/${filteredApp.eventID}`)
                        .setDescription(`Hello Dear ${filteredApp.organiser.name}\n\nWe want to tell you that your Event Supervision Reques has been \`${status}ed\``)

                    fetch(`https://discord.com/api/channels/${filteredApp.channel}/messages`, {
                        method: "POST",
                        body: JSON.stringify({
                            embeds: [embed]
                        }),
                        headers: {
                            "authorization": `Bot ${process.env.TOKEN}`,
                            "Content-Type": "application/json"
                        }
                    }).then((body) => {
                        return body.json()
                    }).then(async (json) => {
                        const msg = json;

                        filteredApp.messageID = msg.id;
                        filteredApp.lastUpdated = Date.now();
                        otherApp.push(filteredApp)
                        maindb.set("appointments", otherApp)
                        return res.send({ error: false, success: true, message: "slot updated" })
                    }).catch((err) => {
                        return console.log(err)
                    })
                } else {
                    const perms = new Discord.BitField([
                        String(Discord.Permissions.FLAGS.VIEW_CHANNEL),
                        String(Discord.Permissions.FLAGS.SEND_MESSAGES)
                    ]);
                    fetch(`https://discord.com/api/guilds/969647038138572881/channels`, {
                        method: "POST",
                        body: JSON.stringify({
                            name: `Event-${filteredApp.eventID}`,
                            topic: `${config.convoyhuburl}event/${filteredApp.eventID}`,
                            permission_overwrites: [
                                {
                                    id: "969647038138572881",
                                    type: 0,
                                    deny: perms
                                }
                            ],
                            parent_id: "986960284474286140"
                        }),
                        headers: {
                            "authorization": `Bot ${process.env.TOKEN}`,
                            "Content-Type": "application/json"
                        }
                    }).then((body) => {
                        return body.json()
                    }).then(async (json) => {
                        const channel = json;
                        filteredApp.channel = channel.id;

                        const embed = new Discord.MessageEmbed()
                            .setColor("#f16432")
                            .setTitle(filteredApp.name)
                            .setURL(`${config.convoyhuburl}event/${filteredApp.eventID}`)
                            .setDescription(`Hello Dear ${filteredApp.organiser.name}\n\nWe want to tell you that your Event Supervision Reques has been \`${status}ed\``)

                        fetch(`https://discord.com/api/channels/${channel.id}/messages`, {
                            method: "POST",
                            body: JSON.stringify({
                                embeds: [embed]
                            }),
                            headers: {
                                "authorization": `Bot ${process.env.TOKEN}`,
                                "Content-Type": "application/json"
                            }
                        }).then((body) => {
                            return body.json()
                        }).then(async (json) => {
                            const msg = json;

                            filteredApp.messageID = msg.id;
                            filteredApp.lastUpdated = Date.now();
                            otherApp.push(filteredApp)
                            maindb.set("appointments", otherApp)
                            return res.send({ error: false, success: true, message: "slot updated" })
                        }).catch((err) => {
                            return console.log(err)
                        })
                    }).catch((err) => {
                        return console.log(err)
                    })
                }
            } else {
                return res.send({ error: true, success: false, message: "You are Not Authorized" })
            }
        } else {
            return res.send({ error: true, success: false, message: "You are Not Authorized" })
        }
    } catch (error) {
        console.log(error)
        return res.send({ error: true, success: false, message: "Error Updating slots. Please contact Site developer", dev_message: String(error) })
    }
})

module.exports = router;