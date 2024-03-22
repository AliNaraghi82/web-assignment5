/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name:Ali Naraghi  Student ID:123747222  Date:Mar.21.2024
 *  Published URL:https://misty-pink-dugong.cyclic.app
 *
 ********************************************************************************/

const express = require("express");
const bodyParser = require("body-parser");
const unCountryData = require("./Modules/unCountries");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "views");

// The code "express.urlencoded({extended:true})" did not work properly, so after doing a little search I found that the "body-parser" package does the exact same thing.
app.use(bodyParser.urlencoded({ extended: true }));

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/un/countries", async (req, res) => {
  try {
    const { region } = req.query;
    if (region) {
      const countriesByRegion = await unCountryData.getCountriesByRegion(
        region
      );
      res.render("countries", { countries: countriesByRegion });
    } else {
      const allCountries = await unCountryData.getAllCountries();
      res.render("countries", { countries: allCountries });
    }
  } catch (err) {
    console.log(err);
    res.status(404).render("404", {
      message: "The region you are looking for is not available.",
    });
  }
});

app.get("/un/countries/:a2code", async (req, res) => {
  try {
    const country = await unCountryData.getCountryByCode(req.params.a2code);
    if (country) {
      res.render("country", { country });
    } else {
      throw new Error("Country not found");
    }
  } catch (err) {
    res.status(404).render("404", {
      message: "The country you are looking for is not available.",
    })();
  }
});

app.get("/un/addCountry", async (req, res) => {
  unCountryData
    .getAllRegions()
    .then((regions) => {
      res.render("addCountry", { regions });
    })
    .catch((err) =>
      res.render("500", { message: "Failed to load regions : " + err })
    );
});

app.post("/un/addCountry", async (req, res) => {
  unCountryData
    .addCountry(req.body)
    .then(() => {
      res.redirect("/un/countries");
    })
    .catch((err) =>
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      })
    );
});

app.get("/un/editCountry/:code", async (req, res) => {
  unCountryData
    .getAllRegions()
    .then((regions) => {
      unCountryData
        .getCountryByCode(req.params.code.toLocaleLowerCase().toUpperCase())
        .then((country) => {
          res.render("editCountry", { regions, country });
        })
        .catch((err) =>
          res
            .status(404)
            .render("404", { message: "Failed to load country data : " + err })
        );
    })
    .catch((err) =>
      res
        .status(500)
        .render("500", { message: "Failed to load regions : " + err })
    );
});

app.post("/un/editCountry", async (req, res) => {
  if (req.body.a2code) {
    unCountryData
      .editCountry(req.body.a2code, req.body)
      .then(() => res.redirect("/un/countries"))
      .catch((err) =>
        res.render("500", {
          message: `I'm sorry, but we have encountered the following error: ${err}`,
        })
      );
  } else {
    res.render("500", {
      message: "There has been an error while updating country data. :(",
    });
  }
});

app.get("/un/deleteCountry/:code", async (req, res) => {
  unCountryData
    .deleteCountry(req.params.code)
    .then(() => res.redirect("/un/countries"))
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});

unCountryData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.error("Error initializing data service: ", err);
  });
