class strategy {
    async strategystart() {
        const LocalStrategy = require("passport-local").Strategy;
        const passport = require("passport");
        const bcrypt = require("bcrypt");
        const maindb = require("../../getdata");


        passport.serializeUser((user, done) => {
            done(null, user);
        })

        passport.deserializeUser((id, done) => {
            done(null, id);
        })

        const authenticateUser = async (email, password, done) => {

            const loginData = maindb.get("logins") || [];
            const user = loginData.find(u => u.email == email.toLowerCase()) || false;

            if (!user) {
                return done(null, false, { message: "User cannot be found" });
            }

            try {
                if (await bcrypt.compare(password, user.password) || password === user.password) {
                    return done(null, user.userID)
                } else {
                    return done(null, false, { message: "password incorrect" })
                }
            } catch (error) {
                done(error)
            }
        }

        // LOCAL STRATEGY
        passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser))
    };
};

module.exports = strategy;