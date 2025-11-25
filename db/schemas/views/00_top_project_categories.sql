-- Top project categories with project counts
CREATE OR REPLACE VIEW projects.top_project_categories AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.description,
  COUNT(p.id) AS project_count
FROM projects.category c
LEFT JOIN projects.project p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.description
ORDER BY project_count DESC, c.name ASC
LIMIT 5;
