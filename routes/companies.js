const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");
const { json } = require("express");

/** Returns a list of all companies in comapnies table in JSON format */

router.get('/', async function (req, res, next) {

  const results = await db.query(
    `SELECT code, name, description
    FROM companies`);
  const companies = results.rows;

  return res.json({ companies });

});

/** Receives company code, returns a company in JSON format
* If company not found, returns NotFoundError
*/

// router.get('/:code', async function (req, res, next) {

//   const code = req.params.code;
//   const result = await db.query(
//     `SELECT code, name, description
//     FROM companies
//     WHERE code = $1`,
//     [code]
//   );
//   const company = result.rows[0];

//   if (!company) throw new NotFoundError(`No matching company: ${code}`);
//   return res.json({ company });

// });

/** Creates a new company, and returns a JSON response with company code, name
 * and description
 */

router.post('/', async function (req, res, next) {

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ($1,$2,$3)
    RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]
  );
  const company = results.rows[0];

  return res.status(201).json({ company });

});

/** Receives company code, updates corresponding company with new name and description
 * Returns JSON with company code, name, and description
 * * If company not found, returns NotFoundError
*/

router.put('/:code', async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");
  //TODO: if user does not input description/name

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
    SET name = $1, description = $2
    WHERE code = $3
    RETURNING code, name, description`,
    [req.body.name, req.body.description, code]
  );

  const company = results.rows[0];
  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });

});

/** Receives company code, deletes corresponding company from companies table
 * Returns JSON response with successful deleted message
 * If company not found, returns NotFoundError
 */

router.delete('/:code', async function (req, res, next) {

  const code = req.params.code;
  const results = await db.query(
    `DELETE FROM companies
    WHERE code = $1
    RETURNING code`,
    [code]
  );

  const company = results.rows[0];
  if (!company) throw new NotFoundError(`No matching company: ${company}`);
  return res.json({ message: 'Company deleted' });

});

/** Receives company code, returns a company with invoices in
 * JSON format. If company not found, returns NotFoundError
*/

router.get('/:code', async function (req, res, next) {

  const code = req.params.code;
  const cResult = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [code]
  );
  const company = cResult.rows[0];

  const iResult = await db.query(
    `SELECT id, amt, comp_code, paid, add_date, paid_date
    FROM invoices
    WHERE comp_code = $1`,
    [code]
  );
  company.invoices = iResult.rows;

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });

});


module.exports = router;