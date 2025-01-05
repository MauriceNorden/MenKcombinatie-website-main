# Welkom Maurice

waarschijnlijk ga je weer helemaal vergeten hoe je deze docker container ooit hebt gebouwd.
Daarom hier de uitleg voor in de toekomst.


## Het bouwen van de image

Eerst ga je een image bouwen, hierin zit je nodejs applicatie in.
Dit doe je door in de root directory `docker build -t mauricenorden/mkcombinatie .`
Uit te voeren.

Daarna kun je met `docker images`
Een lijst opvragen met alle images.
Hier staat ook jou image tussen.

## Het uitvoeren van de docker image

Het uitvoeren van de docker image is ook zeer makkelijk.
Draai hiervoor het commmando `docker run -d -p 3000:3000 mauricenorden/mkcombinatie` uit.
Als je er helemaal klaar voor bent om het zooite in productie te nemen kun je er de flag `--restart ` aan toevoegen zodat de contianer altijd opstart.



## De docker container verkankeren

Mocht je ooit iets moeten aanpassen in de productie docker omgeving wat een zeer slecht iedee is.
Voer dan het commando ` docker exec -it <container id> /bin/bash` uit.


## Afsluitend

Nou dat was het dan met het bouwen.
Beter ga je je infra volledig draaien in docker!
Succces!
