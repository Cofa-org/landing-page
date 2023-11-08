En el package.json cree el comando start que sirve la carpeta dist, esto en necesario para que railway pueda hacer un deploy.
El -s es para evitar redirecciones en una SPA
El -n dehabilita los comportamientos por defecto
El -L indica que no se alojara en el localhost 
El -p indica el puerto
El $PORT busca la variable de puerto configurada en el proyecto de railway