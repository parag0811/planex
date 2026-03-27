import passport from "passport";
import "./githubStrategy";
import "./googleStrategy"

// : route -> GitHub/Google consent -> strategy runs with provider data -> controller runs -> JWT is signed and sent

export default passport