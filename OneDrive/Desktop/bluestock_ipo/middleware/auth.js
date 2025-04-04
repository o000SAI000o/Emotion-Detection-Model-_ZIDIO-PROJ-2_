import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
    // Retrieve the token from the 'authToken' cookie
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store user details in request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

export default authenticate;
