# Modelo de Dados - Atendentes

## Visão Geral

Este documento descreve o modelo de dados completo para o sistema de gerenciamento de atendentes, incluindo todas as entidades relacionadas e seus relacionamentos.

## Entidades Principais

### 1. Atendente

A entidade principal que armazena todas as informações dos atendentes.

#### Campos Principais

- **id**: Identificador único (CUID)
- **usuarioId**: Relacionamento 1:1 com a tabela de usuários
- **cpf**: CPF único do atendente
- **rg**: RG do atendente (opcional)
- **dataNascimento**: Data de nascimento (opcional)
- **telefone**: Telefone principal
- **celular**: Telefone celular (opcional)
- **endereco**: Endereço completo (opcional)
- **cep**: CEP (opcional)
- **cidade**: Cidade (opcional)
- **estado**: Estado (opcional)
- **dataAdmissao**: Data de admissão na empresa
- **cargo**: Cargo atual
- **setor**: Setor de trabalho
- **departamento**: Departamento (opcional)
- **salario**: Salário (decimal, opcional)
- **status**: Status atual do atendente
- **observacoes**: Observações gerais (opcional)
- **foto**: URL da foto do atendente (opcional)
- **criadoEm**: Data de criação do registro
- **atualizadoEm**: Data da última atualização

#### Status Disponíveis

- **ATIVO**: Atendente ativo e trabalhando normalmente
- **INATIVO**: Atendente inativo
- **SUSPENSO**: Atendente suspenso temporariamente
- **TREINAMENTO**: Atendente em período de treinamento
- **FERIAS**: Atendente em férias
- **AFASTADO**: Atendente afastado por outros motivos
- **LICENCA_MEDICA**: Atendente em licença médica
- **LICENCA_MATERNIDADE**: Atendente em licença maternidade

### 2. DocumentoAtendente

Armazena todos os documentos relacionados aos atendentes.

#### Campos

- **id**: Identificador único
- **atendenteId**: Referência ao atendente
- **tipo**: Tipo do documento (enum)
- **nome**: Nome do arquivo
- **descricao**: Descrição opcional
- **arquivo**: URL ou caminho do arquivo
- **tamanho**: Tamanho em bytes
- **mimeType**: Tipo MIME do arquivo
- **versao**: Versão do documento
- **ativo**: Se o documento está ativo
- **criadoEm**: Data de criação
- **atualizadoEm**: Data da última atualização
- **criadoPorId**: ID do usuário que fez o upload

#### Tipos de Documento

- **RG**: Registro Geral
- **CPF**: Cadastro de Pessoa Física
- **CNH**: Carteira Nacional de Habilitação
- **CARTEIRA_TRABALHO**: Carteira de Trabalho
- **TITULO_ELEITOR**: Título de Eleitor
- **COMPROVANTE_RESIDENCIA**: Comprovante de Residência
- **DIPLOMA**: Diploma de Graduação/Pós-graduação
- **CERTIFICADO**: Certificados diversos
- **CONTRATO**: Contrato de trabalho
- **OUTROS**: Outros tipos de documento

### 3. HistoricoAlteracaoAtendente

Registra todas as alterações feitas nos dados dos atendentes para auditoria.

#### Campos

- **id**: Identificador único
- **atendenteId**: Referência ao atendente
- **tipo**: Tipo da alteração (enum)
- **campo**: Campo que foi alterado
- **valorAnterior**: Valor anterior (JSON string)
- **valorNovo**: Novo valor (JSON string)
- **descricao**: Descrição da alteração
- **criadoEm**: Data da alteração
- **criadoPorId**: ID do usuário que fez a alteração
- **ip**: IP de onde foi feita a alteração
- **userAgent**: User agent do navegador

#### Tipos de Alteração

- **CRIACAO**: Criação de novo atendente
- **ATUALIZACAO**: Atualização de dados
- **EXCLUSAO**: Exclusão de atendente
- **ATIVACAO**: Ativação de atendente
- **DESATIVACAO**: Desativação de atendente
- **MUDANCA_STATUS**: Mudança de status
- **UPLOAD_DOCUMENTO**: Upload de documento
- **REMOCAO_DOCUMENTO**: Remoção de documento

## Relacionamentos

### Atendente

- **1:1** com Usuario (usuarioId)
- **1:N** com Avaliacao
- **1:1** com GamificacaoAtendente
- **N:N** com Conquista (através de ConquistaAtendente)
- **1:N** com DocumentoAtendente
- **1:N** com HistoricoAlteracaoAtendente

## Índices de Performance

### Atendente

- status
- setor
- cargo
- departamento
- dataAdmissao
- cpf

### DocumentoAtendente

- atendenteId
- tipo
- ativo
- criadoEm

### HistoricoAlteracaoAtendente

- atendenteId
- tipo
- campo
- criadoEm
- criadoPorId

## Considerações de Segurança

1. **Dados Sensíveis**: CPF, RG e outros documentos devem ser tratados com cuidado especial
2. **Auditoria**: Todas as alterações são registradas no histórico
3. **Soft Delete**: Atendentes são desativados, não excluídos fisicamente
4. **Controle de Acesso**: Documentos têm controle de quem pode visualizar
5. **Versionamento**: Documentos suportam versionamento para manter histórico

## Validações Importantes

1. **CPF**: Deve ser único e válido
2. **Email**: Deve ser único (validado na tabela Usuario)
3. **Documentos**: Validação de tipo e tamanho de arquivo
4. **Status**: Transições de status devem seguir regras de negócio
5. **Relacionamentos**: Integridade referencial mantida via foreign keys
