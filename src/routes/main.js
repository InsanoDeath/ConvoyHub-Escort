const router = require("express").Router();
const maindb = require("../../getdata");
// const Discord = require("discord.js");

router.get("/", (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const { user } = req;

    const events = maindb.get("events") || [];
    const filteredEvents = events.filter(f => Date.parse(f.start_at) >= Date.now())
    filteredEvents.sort((a, b) => {
        return Date.parse(a.start_at) - Date.parse(b.start_at);
    })

    if (req.isAuthenticated()) {
        const userData = maindb.get(String(user))
        res.render("index.ejs", {
            loggedIn: req.isAuthenticated(),
            data: userData,
            events: filteredEvents
        })
    } else {
        res.render("index.ejs", {
            loggedIn: req.isAuthenticated(),
            events: filteredEvents
        })
    }
})

router.get("/about", (req, res, next) => {
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
        res.render("about.ejs", { loggedIn: req.isAuthenticated(), data: userData })
    } else {
        res.render("about.ejs", { loggedIn: req.isAuthenticated() })
    }
})

router.get("/team", (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies.remember == "true") {
        const avblUserData = maindb.get(String(req.cookies.userID)) || false;
        if (avblUserData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            });
        }
    }

    const staffRoles = maindb.get("staffRoles") || [];
    const members = maindb.get("members") || [];
    const staff = members.filter(f => f.isStaff);
    let allStaffRoles = {};
    
    for(var i = 0; i < staff.length; i++) {
        const currRole = staffRoles.find(f => f.roleID == staff[i].roleID)
        if(!allStaffRoles[currRole.order]) {
            allStaffRoles[currRole.order] = [staff[i]];
        } else {
            allStaffRoles[currRole.order].push(staff[i]);
        }
    }
    allStaffRoles = Object.entries(allStaffRoles);
    allStaffRoles.sort((a, b) => {
        return parseInt(a[0]) - parseInt(b[0])
    })

    const { user } = req;
    if (req.isAuthenticated()) {
        const userData = maindb.get(String(user))
        res.render("team.ejs", { loggedIn: req.isAuthenticated(), data: userData, staff: allStaffRoles })
    } else {
        res.render("team.ejs", { loggedIn: req.isAuthenticated(), staff: allStaffRoles })
    }
})

router.get("/patreon", (req, res) => {
    res.redirect("https://convoyhub.in/patreon")
})

module.exports = router;