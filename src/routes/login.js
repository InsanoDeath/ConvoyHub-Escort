const router = require("express").Router();
const passport = require("passport");
const maindb = require("../../getdata");
const config = require("../../config.json");

router.get("/login", (req, res) => {
    const { message } = req.query;
    if (req.isAuthenticated()) {
        if (req.headers.referer && req.headers.referer.includes("?redirect=")) {
            const redirect = req.headers.referer.split("?redirect=")

            try {
                if (redirect[1].startsWith("http") || redirect[1].startsWith("https")) {
                    res.redirect(`${redirect[1]}`)
                } else {
                    res.redirect(`/${redirect[1]}`)
                }
            } catch (error) {
                console.log(error)
                res.redirect("/")
            }
        } else {
            res.redirect("/")
        }
    }

    if(message) {
        return res.render("login.ejs", { loggedIn: req.isAuthenticated(), message: message })
    } else if (req.headers.referer && !req.headers.referer.includes("/auth/register") && !req.headers.referer.includes("forgotpassword") && !req.query.redirect) {
        res.redirect(`/login?redirect=${req.headers.referer.split("login")[0]}`)
    }

    res.render("login.ejs", { loggedIn: req.isAuthenticated(), message: false })
})

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/forbidden',
    // failureFlash: true
}), (req, res) => {
    if (req.body.remember && req.body.remember == "on") {
        res.cookie("remember", true, { maxAge: 1000 * 60 * 60 * 24 * 365 })
        res.cookie("userID", req.user, { maxAge: 1000 * 60 * 60 * 24 * 365 })
    }

    if (req.headers.referer && req.headers.referer.includes("?redirect=")) {
        const redirect = req.headers.referer.split("?redirect=")

        try {
            if (redirect[1].startsWith("http")) {
                res.redirect(`${redirect[1]}`)
            } else {
                res.redirect(`/${redirect[1]}`)
            }
        } catch (error) {
            console.log(error)
            res.redirect("/")
        }
    } else {

        res.redirect("/")
    }
});

router.get("/forbidden", (req, res) => {
    res.redirect("/login?message=Credentials entered does not match please try again")
})

router.get("/logout", (req, res) => {
    req.session.destroy(function (err) {
        if (err) return res.send(err)
        res.cookie("remember", false)
        if (req.headers.referer) {
            res.redirect(req.headers.referer)
        } else {
            res.redirect("/login")
        }
    })
})

router.get("/password/reset", (req, res) => {
    res.redirect(`${config.convoyhuburl}password/reset`);
})

router.get("/register", (req, res) => {
    res.redirect(`${config.convoyhuburl}register`);
})

module.exports = router;