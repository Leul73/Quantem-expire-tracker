document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("YOUR_USER_ID"); // Initialize EmailJS with your User ID

    loadItems();

    document.getElementById('item-form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const userEmail = document.getElementById('user-email').value;
        const itemName = document.getElementById('item-name').value;
        const manufactureDate = document.getElementById('manufacture-date').value;
        const expiryDate = document.getElementById('expiry-date').value;
        
        if (userEmail && itemName && manufactureDate && expiryDate) {
            addItem(userEmail, itemName, manufactureDate, expiryDate);
            saveItem(userEmail, itemName, manufactureDate, expiryDate);
            document.getElementById('user-email').value = '';
            document.getElementById('item-name').value = '';
            document.getElementById('manufacture-date').value = '';
            document.getElementById('expiry-date').value = '';
        }
    });

    document.getElementById('scan-qr').addEventListener('click', function() {
        document.getElementById('qr-file').click();
    });

    document.getElementById('qr-file').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        
        QrScanner.scanImage(file, { returnDetailedScanResult: true })
            .then(result => {
                const [userEmail, itemName, manufactureDate, expiryDate] = result.data.split(',');
                
                if (userEmail && itemName && manufactureDate && expiryDate) {
                    addItem(userEmail, itemName, manufactureDate, expiryDate);
                    saveItem(userEmail, itemName, manufactureDate, expiryDate);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Failed to read QR code.');
            });
    });

    checkExpiries();
});

function addItem(userEmail, name, manufactureDate, expiryDate) {
    const itemList = document.getElementById('item-list');
    
    const itemElement = document.createElement('li');
    itemElement.textContent = `${name} - Manufactured on: ${manufactureDate}, Expires on: ${expiryDate}`;

    const timeLeftElement = document.createElement('div');
    timeLeftElement.className = 'time-left';

    const timeLeft = calculateTimeLeft(expiryDate);
    timeLeftElement.textContent = `Time left: ${timeLeft.days} days, ${timeLeft.hours} hours`;

    itemElement.appendChild(timeLeftElement);

    const today = new Date().toISOString().split('T')[0];
    if (new Date(expiryDate) < new Date(today)) {
        itemElement.classList.add('expired');
        sendExpiryEmail(userEmail, name, expiryDate);
    } else {
        itemElement.classList.add('unexpired');
    }
    
    itemList.appendChild(itemElement);
}

function saveItem(userEmail, name, manufactureDate, expiryDate) {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.push({ userEmail, name, manufactureDate, expiryDate });
    localStorage.setItem('items', JSON.stringify(items));
}

function loadItems() {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.forEach(item => addItem(item.userEmail, item.name, item.manufactureDate, item.expiryDate));
}

function checkExpiries() {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    items.forEach(item => {
        const expiryDate = new Date(item.expiryDate);
        const currentDate = new Date(today);

        const diffTime = Math.abs(expiryDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 3) {
            alert(`Item ${item.name} is expiring in ${diffDays} day(s)!`);
        }
    });
}

function calculateTimeLeft(expiryDate) {
    const now = new Date();
    const expiration = new Date(expiryDate);

    const diffTime = expiration - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
        days: diffDays,
        hours: diffHours
    };
}

function sendExpiryEmail(userEmail, itemName, expiryDate) {
    const templateParams = {
        user_email: userEmail,
        item_name: itemName,
        expiry_date: expiryDate
    };

    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function(response) {
            console.log('Email sent successfully!', response.status, response.text);
        }, function(error) {
            console.error('Failed to send email.', error);
        });
}