const APP_INFO = {
    version: '0.2.0',
    limits: {
        username: { min: 3, max: 20 },
        password: { min: 6, max: 30 },
        message: { min: 1, max: 500 }
    },
    imagePaths: {
        logo: '/images/logo.png',
        avatar: '/images/default-avatar.png'
    },
    colors: {
        main: '#1a1a1a',
        mainDark: '#121212',
        accent: '#3498db',
        accentDark: '#2980b9',
        accentHeld: '#2c3e50',
        main2: '#2ecc71',
        highlight: '#f39c12',
        background: '#2c3e50',
        text: '#ecf0f1'
    }
};