const APP_INFO = {
    version: '1.0.0',
    limits: {
        username: { min: 3, max: 20 },
        password: { min: 6, max: 30 },
        message: { min: 1, max: 500 }
    },
    imagePaths: {
        // For future use
        logo: '/images/logo.png',
        avatar: '/images/default-avatar.png'
    },
    colors: {
        main: '#3498db',
        mainDark: '#2980b9',
        accent: '#e74c3c',
        accentDark: '#c0392b',
        accentHeld: '#e67e22',
        main2: '#2ecc71',
        highlight: '#f1c40f',
        background: '#ecf0f1'
    }
};