var mysql = require("mysql");
const { promisify } = require("util");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "20122012",
  database: "xvm",
});

db.query = promisify(db.query);

const createInexistCatg = async (name) => {
  await db.query("insert into `product_category` (`name`) VALUES (?)", [
    JSON.stringify({
      en: name,
      ar: name,
      fr: name,
    }),
  ]);
  return await db.query(
    "select * from `product_category` order by created_at desc limit 1",
    []
  );
};

const createInexistSubCatg = async (name, Parent_Category_ID) => {
  await db.query(
    "insert into `product_subcategory` (`name`, `Parent_Category_ID`) VALUES (?, ?)",
    [
      JSON.stringify({
        en: name,
        ar: name,
        fr: name,
      }),
      Parent_Category_ID,
    ]
  );
  return await db.query(
    "select * from `product_subcategory` order by created_at desc limit 1",
    []
  );
};

const start = async () => {
  try {
    // alter table product_category modify name json;
    // alter table product_subcategory modify name json;
    const JsonProducts = require("./Done.json");

    let AllCategories = await db.query("SELECT * FROM `product_category`", []);

    let AllSubCategories = await db.query(
      "SELECT * FROM `product_subcategory`",
      []
    );

    let SqlVars = [];

    for (const i in JsonProducts) {
      let CatgID = AllCategories.reduce(
        (prev, val) =>
          JSON.parse(val.name)["en"] === JsonProducts[i].Category_ID
            ? val.Category_ID
            : prev,
        null
      );
      if (!CatgID) {
        CatgID = await createInexistCatg(JsonProducts[i].Category_ID);
        AllCategories.push(CatgID[0]);
        CatgID = CatgID[0].Category_ID;
      }

      JsonProducts[i].Category_ID = CatgID;
      let SubCatgID = AllSubCategories.reduce(
        (prev, val) =>
          JSON.parse(val.name)["en"] === JsonProducts[i].Sub_Category_ID &&
          val.Parent_Category_ID === CatgID
            ? val.subCategory_ID
            : prev,
        null
      );
      if (!SubCatgID) {
        SubCatgID = await createInexistSubCatg(
          JsonProducts[i].Sub_Category_ID,
          CatgID
        );
        AllSubCategories.push(SubCatgID[0]);
        SubCatgID = SubCatgID[0].subCategory_ID;
      }
      JsonProducts[i].Sub_Category_ID = SubCatgID;
    }

    await db.query(
      "insert into product (reference, Category_ID, Sub_Category_ID, name, short_description, description, images, code, mesures, long_images, price, stock, points, display, note, colors, shippings)" +
        " VALUES ?",
      [
        JsonProducts.map((val) => [
          val.reference,
          val.Category_ID,
          val.Sub_Category_ID,
          JSON.stringify(val.name),
          JSON.stringify(val.short_description),
          JSON.stringify(val.description),
          val.images,
          val.code,
          JSON.stringify(val.mesures),
          val.long_images,
          val.price,
          val.stock,
          val.points,
          val.display,
          val.note,
          val.colors,
          val.shippings,
        ]),
      ]
    );
    console.log("done");
  } catch (e) {
    console.log("something went wrong !!", e);
  }
  process.exit(0);
};

start();

