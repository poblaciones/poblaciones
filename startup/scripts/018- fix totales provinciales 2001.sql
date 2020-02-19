
update geography_item G1 JOIN (
select gei_parent_id gid, sum(gei_population) population,
    sum(gei_households) households, sum(gei_children) children from geography_item where gei_geography_id = 89 group by gei_parent_id) G2
    ON G1.gei_id = G2.gid
SET G1.gei_population = G2.population, G1.gei_households = G2.households, G1.gei_children = G2.children
WHERE  G1.gei_geography_id = 88;


UPDATE version SET ver_value = '018' WHERE ver_name = 'DB';