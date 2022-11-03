SELECT rot, COUNT(rot) as usages
FROM operations
WHERE date = date('now')
GROUP BY rot