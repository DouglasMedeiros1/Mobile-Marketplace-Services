import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {categoriesService} from '../api/services/categoriesService';
import type {Category} from '../types/api.types';

interface CategorySearchBarProps {
  onCategorySelect: (category: Category | null) => void;
  placeholder?: string;
}

const CategorySearchBar: React.FC<CategorySearchBarProps> = ({
  onCategorySelect,
  placeholder = 'Pesquisar por categoria...',
}) => {
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.nome.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchText, categories]);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Erro', 'Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSearchText(category.nome);
    setShowDropdown(false);
    onCategorySelect(category);
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    setSearchText('');
    setShowDropdown(false);
    onCategorySelect(null);
  };

  const renderCategoryItem = ({item}: {item: Category}) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleSelectCategory(item)}>
      <Text style={styles.dropdownItemText}>{item.nome}</Text>
      {item.descricao && (
        <Text style={styles.dropdownItemDescription} numberOfLines={1}>
          {item.descricao}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setShowDropdown(true)}
          placeholderTextColor="#999"
        />
        {selectedCategory && (
          <TouchableOpacity onPress={handleClearCategory} style={styles.clearButton}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdownContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2196F3" />
                </View>
              ) : (
                <FlatList
                  data={filteredCategories}
                  renderItem={renderCategoryItem}
                  keyExtractor={item => item.id.toString()}
                  style={styles.dropdown}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
                    </View>
                  }
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 15,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdown: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default CategorySearchBar;
