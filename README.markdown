# Salor Point of Sale

Salor Point of Sale is a broswer based point of sale system licensed under the MIT License,
it features an almost completely offline interface, allowing you to connect to the internet
once to download the software into the browser, and from that point on can be run completely
offline.

## How to install

    sudo apt-get install apache2 libapache2-mod-php5
    git clone https://github.com/jasonknight/salor.git
    cd /var/www/
    ln -s /path/salor/repo salor

Open up a browser and point it to http://localhost/salor.
