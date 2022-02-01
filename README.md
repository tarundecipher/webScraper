# webScraper for StackOverflow

After moving to the directory of the project make sure you have docker and docker-compose installed on your system. Consider https://docs.docker.com/engine/
to install.

## Starting the database (Postgres) instance

After that make sure there is no application running on port 5432.
A postgres container will be up and running on port 5432 after executing the below command.

```Docker
docker-compose up
```

## Starting the application

Change the entry point url in app.js according to your convenience.
Execute following commands to install the dependencies and run the application.

```javascript
npm i
node app.js
```

## Closing the postgres instance

Execute the following command to close the running postgres instance.

```Docker
docker-compose down
```

## CSV File

Csv file is created in the root director of the project with name
"scraped_data.csv" after the user quits the script with Ctrl+C from the terminal.
