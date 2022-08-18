const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");
const { json } = require("express");

/** Returns a list of all invoices in invoices table in JSON format */

router.get('/', async function (req, res, next) {

  const results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
    FROM invoices
    `);
  const invoices = results.rows;

  return res.json({ invoices });

});

/** Receives invoice id, returns a invoice with company details in JSON format
* If invoice not found, returns NotFoundError
*/

router.get('/:id', async function (req, res, next) {

  const id = req.params.id;
  const iResult = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id = $1`,
    [id]
  );
  const invoice = iResult.rows[0];

  const cResults = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [invoice.comp_code]
  );
  invoice.company = cResults.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.json({ invoice });

});

/** Creates a new invoice with amount and comp_code, and
 * returns a JSON response with id, comp_code, amt,
 * paid, add_date
 */

router.post('/', async function (req, res, next) {

  const results = await db.query(
    `INSERT INTO invoices (amt, comp_code)
    VALUES ($1,$2)
    RETURNING id, amt, comp_code, paid, add_date, paid_date`,
    [req.body.amt, req.body.comp_code]
  );
  const invoice = results.rows[0];

  return res.status(201).json({ invoice });

});

/** Receives invoice id, updates corresponding invoice with new amount
 * Returns JSON with invoice id, amt, comp_code, paid, add_date, paid_date
 * * If invoice not found, returns NotFoundError
*/

router.put('/:id', async function (req, res, next) {
  if ("id" in req.body) throw new BadRequestError("Not allowed");
  if (!req.body.amt || req.body.amt < 0)
    throw new BadRequestError("must enter valid amt");

  const id = req.params.id;
  const results = await db.query(
    `UPDATE invoices
    SET amt = $1
    WHERE id = $2
    RETURNING id, amt, comp_code, paid, add_date, paid_date`,
    [req.body.amt, id]
  );

  const invoice = results.rows[0];
  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.json({ invoice });

});

/** Receives invoice id, deletes corresponding invoice from invoices table
 * Returns JSON response with successful deleted message
 * If invoice not found, returns NotFoundError
 */

router.delete('/:id', async function (req, res, next) {

  const id = req.params.id;
  const results = await db.query(
    `DELETE FROM invoices
    WHERE id = $1
    RETURNING id`,
    [id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${invoice}`);
  return res.json({ message: 'invoice deleted' });

});


module.exports = router;