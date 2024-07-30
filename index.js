const express = require('express');
const cors = require('cors');
const { pool } = require('./config');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());

// aqui vão os métodos da API que consultam o banco
const getProdutos = async (request, response) => {
    try {
        const { rows } = await pool.query(`SELECT codigo, nome, descricao, 
            quantidade_estoque, valor, 
            to_char(data_cadastro,'YYYY-MM-DD') as data_cadastro
            FROM produtos ORDER BY codigo`);
        return response.status(200).json(rows);
    } catch (err) {
        return response.status(400).json({
            'status' : 'error',
            'messagem' : 'Erro ao consultar os produtos: ' + err
        })
    }
}

const addProduto = async (request, response) => {
    try {
        const { nome, descricao, quantidade_estoque, valor, data_cadastro } 
                = request.body;
        const results = await pool.query(`INSERT INTO produtos 
            (nome, descricao, quantidade_estoque, valor, data_cadastro)
            VALUES ($1 , $2 , $3 , $4 , $5)
            RETURNING codigo, nome, descricao, quantidade_estoque, valor, 
            to_char(data_cadastro,'YYYY-MM-DD') as data_cadastro`,
        [nome, descricao, quantidade_estoque, valor, data_cadastro]);
        const linhaInserida = results.rows[0];
        return response.status(200).json({
            status : 'success' , message : 'Produto Criado',
            objeto : linhaInserida
        })             
    } catch (err) {
        return response.status(400).json({
            'status' : 'error',
            'messagem' : 'Erro ao inserir o produto: ' + err
        })
    }
}

const updateProduto = async (request, response) => {
    try {
        const { codigo, nome, descricao, quantidade_estoque, valor, data_cadastro }
         = request.body;
        const results = await pool.query(`UPDATE produtos SET nome=$2, descricao=$3, 
            quantidade_estoque=$4, valor=$5, data_cadastro=$6
            WHERE codigo=$1 
            RETURNING codigo,nome, descricao, quantidade_estoque, valor, 
            to_char(data_cadastro,'YYYY-MM-DD') as data_cadastro`,
            [codigo, nome, descricao, quantidade_estoque, valor, data_cadastro]);
        const linhaalterada = results.rows[0];
        return response.status(200).json({
            status: "success", message: "Produto alterado",
            objeto: linhaalterada
        });
    } catch (err) {
        return response.status(400).json({ status: 'error', message: err });
    }
}

const deleteProduto = async (request, response) => {
    const codigo = request.params.codigo;
    try {
        const results = await pool.query(`DELETE FROM produtos WHERE codigo = $1`, 
            [codigo]);
        if (results.rowCount == 0) {
            return response.status(400).json({
                status: 'error',
                message: `Nenhum registro encontrado com o código ${codigo} para ser removido`
            });
        } else {
            return response.status(200).json({
                status: "success", message: "Produto removido com sucesso"
            });
        }
    } catch (err) {
        return response.status(400).json({ status: 'error', message: err });
    }
}

const getProdutoPorCodigo = async (request, response) => {
    const codigo = request.params.codigo;
    try {
        const results = await pool.query(`SELECT codigo, nome, descricao, quantidade_estoque, 
            valor, to_char(data_cadastro,'YYYY-MM-DD') as data_cadastro 
            FROM produtos WHERE codigo = $1`, [codigo]);
        if (results.rowCount == 0) {
            return response.status(400).json({
                status: 'error',
                message: `Nenhum registro encontrado com o código ${codigo}`
            });
        } else {
            const categoria = results.rows[0];
            return response.status(200).json(categoria);
        }
    } catch (err) {
        return response.status(400).json({ status: 'error', message: err });
    }
}

app.route('/produtos')
   .get(getProdutos)
   .post(addProduto)
   .put(updateProduto)

app.route('/produtos/:codigo')
   .get(getProdutoPorCodigo)
   .delete(deleteProduto)




// inicia a API


app.listen(process.env.PORT || 3002, ()=> {
    console.log('Servidor da API rodando na porta 3002')
})