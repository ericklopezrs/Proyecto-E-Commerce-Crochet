# README CHINGON
Lo primero que se debe de hace es instalar PostgreSQL, buscando "PostgreSQL download" funcionara. Al mismo tiempo tambien busquen su gestor de base de datos. En mi caso yo use **DBeaver**. Si es que usan DBeaver deben de seguir los siguientes pasos:

## Pasos

**Paso 1:** 
Lo primero que deben de hacer es irse a la esquina superior izquierda, y veran que dice "Nueva Conexion".  
<img width="476" height="708" alt="imagen" src="https://github.com/user-attachments/assets/90b020ff-a6c4-4371-8174-39f1e08a498d" />

Le daran ahi, y les pedira el usuario, y la contraseña. 
> [!NOTE]
> Ustedes al instalar PostgreSQL, se les pedira una contraseña, por lo cual esa contraseña sera la que deberan introducir en la nueva conexion. El usuario, y la base de datos la dejan sin mover.

**Paso 2:**  
Una vez que tengan la conexion creada, se deberan ir a base de datos, despues a postgres, esquemas y lleguen hasta public.  
<img width="483" height="98" alt="imagen" src="https://github.com/user-attachments/assets/1fb458e0-44e8-458d-b700-58c84b0a7672" />

En public le daran click derecho, y buscaran donde dice herramientas y le picaran a restaurar backup.
<img width="683" height="431" alt="imagen" src="https://github.com/user-attachments/assets/a56b0b84-ac45-4598-928b-e303d119fd96" />

**Paso 3:**  
<img width="699" height="484" alt="imagen" src="https://github.com/user-attachments/assets/8a2067a9-4dcc-45fd-a80b-1ed881941b06" />  
Donde dice format, seleccionaran plain, y donde dice Backup file le daran al boton de la carpeta. Al inicio no les aparecera los archivos .sql, es por eso que se deben de ir a la derecha de donde dice nombre de los archivos y tienen que seleccionar
los archivos que quieren que les aparezca.  
<img width="947" height="533" alt="imagen" src="https://github.com/user-attachments/assets/72554cd9-cbeb-475f-99ca-737bdd39d12e" />  
Una vez que seleccionen .sql, les aparecera la bdd.   

**Paso 4:**  
Si es que siguieron todos los pasos bien, lo primero que deberan de hacer es irse a la carpeta del back y crear un nuevo archivo llamado .env
Una vez que hayan creado el archivo deberan de poner algo como esto.  
<img width="306" height="169" alt="imagen" src="https://github.com/user-attachments/assets/e171d359-4df1-4142-a6b1-6c38d6bedcd9" />  
Obviamente donde dice su contraseña va la contraseña que pusieron de PostgreSQL. Y si es que siguieron todos los pasos bien, todo deberia de funcionar de manera correcta.
