

# ============================================
# GESTION DES PACKAGES DE CRÉDITS (CRUD)
# ============================================

@admin_bp.route('/credit-packages', methods=['GET'])
def get_credit_packages():
    """Récupérer la liste des packages de crédits"""
    if not require_super_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        from src.models.credit_package import CreditPackage
        
        package_type = request.args.get('type')  # 'player' ou 'club'
        
        query = CreditPackage.query
        if package_type:
            query = query.filter_by(package_type=package_type)
        
        packages = query.order_by(CreditPackage.credits.asc()).all()
        
        return jsonify({
            'packages': [pkg.to_dict() for pkg in packages]
        }), 200
        
    except Exception as e:
        logger.error(f'Erreur lors de la récupération des packages: {e}')
        return jsonify({'error': 'Erreur serveur'}), 500


@admin_bp.route('/credit-packages', methods=['POST'])
def create_credit_package():
    """Créer un nouveau package de crédits"""
    if not require_super_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        from src.models.credit_package import CreditPackage
        
        data = request.get_json()
        
        # Validation
        if not all(k in data for k in ['credits', 'price_dt', 'package_type']):
            return jsonify({'error': 'Champs manquants'}), 400
        
        if data['credits'] <= 0 or data['price_dt'] <= 0:
            return jsonify({'error': 'Les crédits et le prix doivent être positifs'}), 400
        
        if data['package_type'] not in ['player', 'club']:
            return jsonify({'error': 'Type de package invalide'}), 400
        
        # Générer un ID unique        
        pkg_id = data.get('id') or f"pack_custom_{uuid.uuid4().hex[:8]}"
        
        # Vérifier si l'ID existe déjà
        existing = CreditPackage.query.get(pkg_id)
        if existing:
            return jsonify({'error': 'Un package avec cet ID existe déjà'}), 400
        
        # Créer le package
        new_package = CreditPackage(
            id=pkg_id,
            credits=data['credits'],
            price_dt=data['price_dt'],
            package_type=data['package_type'],
            description=data.get('description', ''),
            is_popular=data.get('is_popular', False),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_package)
        db.session.commit()
        
        logger.info(f'Package créé: {pkg_id}')
        return jsonify({
            'message': 'Package créé avec succès',
            'package': new_package.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f'Erreur lors de la création du package: {e}')
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur'}), 500


@admin_bp.route('/credit-packages/<string:package_id>', methods=['PUT'])
def update_credit_package(package_id):
    """Mettre à jour un package de crédits"""
    if not require_super_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        from src.models.credit_package import CreditPackage
        
        package = CreditPackage.query.get(package_id)
        if not package:
            return jsonify({'error': 'Package non trouvé'}), 404
        
        data = request.get_json()
        
        # Mise à jour des champs
        if 'credits' in data:
            if data['credits'] <= 0:
                return jsonify({'error': 'Les crédits doivent être positifs'}), 400
            package.credits = data['credits']
        
        if 'price_dt' in data:
            if data['price_dt'] <= 0:
                return jsonify({'error': 'Le prix doit être positif'}), 400
            package.price_dt = data['price_dt']
        
        if 'description' in data:
            package.description = data['description']
        
        if 'is_popular' in data:
            package.is_popular = data['is_popular']
        
        if 'is_active' in data:
            package.is_active = data['is_active']
        
        package.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f'Package mis à jour: {package_id}')
        return jsonify({
            'message': 'Package mis à jour avec succès',
            'package': package.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Erreur lors de la mise à jour du package: {e}')
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur'}), 500


@admin_bp.route('/credit-packages/<string:package_id>', methods=['DELETE'])
def delete_credit_package(package_id):
    """Supprimer un package de crédits (si jamais acheté)"""
    if not require_super_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        from src.models.credit_package import CreditPackage
        
        package = CreditPackage.query.get(package_id)
        if not package:
            return jsonify({'error': 'Package non trouvé'}), 404
        
        # Vérifier si le package a été acheté
        # TODO: Ajouter une vérification dans l'historique d'achats
        # Pour l'instant, on permet la suppression
        
        db.session.delete(package)
        db.session.commit()
        
        logger.info(f'Package supprimé: {package_id}')
        return jsonify({
            'message': 'Package supprimé avec succès'
        }), 200
        
    except Exception as e:
        logger.error(f'Erreur lors de la suppression du package: {e}')
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur'}), 500
