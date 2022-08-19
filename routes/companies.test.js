const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('Test', 'TestCompany' ,'for testing')
    RETURNING code, name, description`);
  testCompany = result.rows[0];

  let invoice = await db.query(`
    INSERT INTO invoices(comp_code, amt)
    VALUES ('Test', 100)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);

  testCompany.invoices = invoice.rows;
});


/** GET /cats - returns `{cats: [cat, ...]}` */

describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
});
// end

describe("GET /companies/:code", function () {
  test('Gets 1 company', async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    console.log(resp.body);
    expect([resp.body]).toEqual([
      { company: testCompany }
    ]);
  });

  test('Gets 0 company', async function () {
    const resp = await request(app).get(`/companies/hello`);
    expect(resp.statusCode).toEqual(404);
  });
});



describe("POST /companies", function () {
  test('Create a company', async function () {
    const resp = await request(app).post('/companies')
      .send(
        { code: "test2", name: "test2Name", description: "test2desc" });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(
      {
        company:
          { code: "test2", name: "test2Name", description: "test2desc" }
      }
    );
  });
});
