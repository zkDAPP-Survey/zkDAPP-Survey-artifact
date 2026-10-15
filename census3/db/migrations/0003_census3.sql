-- +goose Up
INSERT OR IGNORE INTO token_types (id, type_name) VALUES (7, 'erc1155');

-- +goose Down
DELETE FROM token_types WHERE id = 7 AND type_name = 'erc1155';
