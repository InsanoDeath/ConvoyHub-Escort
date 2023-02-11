class express {
    init(db) {
        const express = require("express")
        const app = new express()
        const passport = require("passport")
        const session = require("express-session")
        const path = require("path")
        const fs = require("fs")
        const config = require("../config.json")
        const cookieParser = require("cookie-parser")

        const mainStrategy = require("./strategy/strategy")
        const strategy = new mainStrategy
        strategy.strategystart()


        app.set("view-engine", "ejs")

        // MIDDLE WARES
        app.use(session({
            secret: "convoyhubisthebestwebapptomanageallyourevents",
            saveUninitialized: true,
            resave: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.use(express.static(path.join(__dirname, "routes", "HTML")))
        app.use(express.json())
        app.use(express.urlencoded({ extended: false }))
        app.use(cookieParser())

        app.use((req, res, next) => {

            if (req.isUnauthenticated() && req.cookies.remember == "true") {
                const avblUserData = db.get(String(req.cookies.userID)) || false;
                if (avblUserData) {
                    req.login(String(req.cookies.userID), function (err) {
                        if (err) { return next(err); }
                    });
                }
            } else if (req.isAuthenticated()) {
                const { user } = req;
                const avblUserData = db.get(String(user)) || false;
                if (!avblUserData) {
                    req.session.destroy();
                }
            }
            next()
        })

        const routes = fs.readdirSync("./src/routes").filter(r => r.endsWith(".js"))
        for (let route of routes) {
            const authRoute = require(`./routes/${route}`)
            app.use("/", authRoute)
        }

        app.use((req, res, next) => {
            const err = new Error("Page Not Found")
            err.status = 404
            next(err)
        })

        app.use((err, req, res, next) => {
            res.status(err.status || 500)

            if (err.status == 404) {
                return res.render("404.ejs", { error: err, footer: config.Footer })
            } else if (err.status == 403) {
                return res.render("403.ejs", { error: err })
            } else if (err.status == 401) {
                return res.render("401.ejs", { error: err })
            } else {
                try {
                    return res.send({ error: err.status, message: err.message })
                } catch { }
            }
        })

        const port = process.env.PORT || config.express.PORT
        const server = app.listen(port, async () => {
            console.log(`Listennig to port ${port} `)
        })
        server.setTimeout(0)
    }
}

module.exports = express;