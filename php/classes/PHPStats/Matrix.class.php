<?php
/**
 * PHP Statistics Library
 *
 * Copyright (C) 2011-2012 Michael Cordingley<Michael.Cordingley@gmail.com>
 * 
 * This library is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Library General Public License as published
 * by the Free Software Foundation; either version 3 of the License, or 
 * (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Library General Public
 * License for more details.
 * 
 * You should have received a copy of the GNU Library General Public License
 * along with this library; if not, write to the Free Software Foundation, 
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 * 
 * LGPL Version 3
 *
 * @package PHPStats
 */
 


namespace PHPStats;

require_once "Stats.class.php";

/**
 * Matrix class
 * 
 * Class representing a matrix and exposing useful instance and static function
 * for manipulating matrices.
 * 
 * @todo Optimize calculations
 */
class Matrix {
	private $matrix = array();

	//Check to see if matrices are same size: m by n and m by n
	private function sizeCheck(Matrix $matrixA, Matrix $matrixB) {
		if ($matrixA->getRows() != $matrixB->getRows() || $matrixA->getColumns() != $matrixB->getColumns())
			throw new MatrixException('Matrices are wrong size: '.$matrixA->getRows().' by '.$matrixA->getColumns().' and '.$matrixB->getRows().' by '.$matrixB->getColumns());
	}

	//Check to see if matrices can be multiplied: m by n and n by p
	private function multiplyCheck(Matrix $matrixA, Matrix $matrixB) {
		if ($matrixA->getColumns() != $matrixB->getRows())
			throw new MatrixException('Matrices are wrong size: '.$matrixA->getRows().' by '.$matrixA->getColumns().' and '.$matrixB->getRows().' by '.$matrixB->getColumns());
	}

	//Check to see if matrix is square: m by m
	private function checkSquare(Matrix $matrix) {
		if ($matrix->getColumns() != $matrix->getRows())
			throw new MatrixException('Matrices is not square: '.$matrix->getRows().' by '.$matrix->getColumns());
	}

	/**
	 * Constructor function
	 * 
	 * Creates a new matrix object.  As an example, when given a string like
	 * '[1, 2, 3; 4, 5, 6; 7, 8, 9]', then it will construct a new matrix
	 * with 1, 2, and 3 as the values of the first row and 7, 8, and 9
	 * as the values of the last row.
	 * Also accepts arrays, so array(array(1, 2, 3), array(4, 5, 6) array(7, 8, 9)
	 * is equivalent to the above example.
	 * 
	 * @param string $ A string representing a matrix literal or an array to convert into a matrix
	 * @return matrix A new matrix object.
	 */
	public function __construct($literal) {
		$this->matrix = array();
		
		if (is_string($literal)) {
			$literal = substr($literal, strpos($literal, '[') + 1, strpos($literal, ']') - strpos($literal, '[') - 1);
			$rowStrings = explode(';', $literal);
			
			$i = 0;
			
			foreach ($rowStrings as $rowString) {
				$this->matrix[$i] = array();
				$j = 0;
				
				foreach (explode(',', $rowString) as $element) {
					$this->matrix[$i][$j] = (float)$element;
					$j++;
				}
				
				$i++;
			}
		}
		else if (is_array($literal)) {
			$columns = 0;
			foreach ($literal as $row) {
				$columns = max($columns, count($row));
			}

			$i = 0;
			foreach ($literal as $row) {
				if(!is_array($row)) throw new MatrixException('Non-array row definition in array-based matrix construction.');

				$this->matrix[$i] = array();
				$j = 0;

				foreach ($row as $element) {
					$this->matrix[$i][$j] = $element;
					$j++;
				}

				for (; $j < $columns; $j++) { //Zero fill incomplete rows
					$this->matrix[$i][$j] = 0;
				}

				$i++;
			}
		}
		else throw new MatrixException('Invalid matrix constructor options.');
	}

	/**
	 * Add function
	 * 
	 * Adds two matrices together
	 * 
	 * @param matrix $matrixB The second matrix to add
	 * @return matrix The summed matrix
	 */
	public function add(Matrix $matrixB) {
		$this->sizeCheck($this, $matrixB);

		$rows = $this->getRows();
		$columns = $this->getColumns();
		$newMatrix = Matrix::zero($rows, $columns);

		for ($i = 1; $i <= $rows; $i++) {
			for ($j = 1; $j <= $columns; $j++) {
				$newMatrix->setElement($i, $j, $this->getElement($i, $j) + $matrixB->getElement($i, $j));
			}
		}

		return $newMatrix;
	}

	/**
	 * Adjoint function
	 * 
	 * Computes the adjoint of the matrix
	 * 
	 * @return matrix The matrix's adjoint
	 */
	public function adjoint() {
		$this->checkSquare($this);

		$newMatrix = self::zero($this->getRows(), $this->getColumns());
		for ($i = 1; $i <= $this->getRows(); $i++) {
			for ($j = 1; $j <= $this->getColumns(); $j++) {
				$newMatrix->setElement($j, $i, pow(-1, $i + $j)*$this->reduce($i, $j)->determinant()); //May as well do the transpose here
			}
		}
		return $newMatrix;
	}

	/**
	 * Determinant function
	 * 
	 * Returns the determinant of the matrix
	 * 
	 * @return float The matrix's determinant
	 */
	public function determinant() {
		$this->checkSquare($this);

		if ($this->getRows() == 1) return $this->getElement(1, 1);

		$sum = 0;
		$i = 1; //Statically choose the first row for cofactor expansion
		for ($j = 1; $j <= $this->getColumns(); $j++) {
			$sum += pow(-1, $i + $j)*$this->getElement($i, $j)*$this->reduce($i, $j)->determinant();
		}
		return $sum;
	}

	/**
	 * Dot Multiply function
	 * 
	 * Multiplies this matrix against a second matrix
	 * 
	 * @param matrix $matrixB The second matrix in the multiplication
	 * @return matrix The multiplied matrix
	 */
	public function dotMultiply(Matrix $matrixB) {
		$this->multiplyCheck($this, $matrixB);

		$rows = $this->getRows();
		$columns = $matrixB->getColumns();

		$newMatrix = Matrix::zero($rows, $columns);

		for ($i = 1; $i <= $rows; $i++) {
			for ($j = 1; $j <= $columns; $j++) {
				$row = $this->matrix[$i - 1];

				$column = array();
				for ($k = 1; $k <= $rows; $k++) $column[] = $matrixB->getElement($k, $j);

				$newMatrix->setElement($i, $j, \PHPStats\Stats::sumXY($row, $column));
			}
		}

		return $newMatrix;
	}

	/**
	 * Get Colunns function
	 * 
	 * Returns the number of colunns in the matrix
	 * 
	 * @return int The number of colunns in the matrix
	 */
	public function getColumns() {
		return count($this->matrix[0]);
	}

	/**
	 * Get Element function
	 * 
	 * Returns the matrix element at the specified location.
	 * 
	 * @param int $row The row in the matrix to return
	 * @param int $column The column in the matrix to return
	 * @return float The matrix element
	 */
	public function getElement($row, $column) {
		return $this->matrix[$row - 1][$column - 1];
	}

	/**
	 * Get Rows function
	 * 
	 * Returns the number of rows in the matrix
	 * 
	 * @return int The number of rows in the matrix
	 */
	public function getRows() {
		return count($this->matrix);
	}

	/**
	 * Inverse function
	 * 
	 * Returns the inverse of the matrix
	 * 
	 * @return matrix The matrix's inverse
	 */
	public function inverse() {
		return $this->adjoint()->scalarMultiply(1/$this->determinant());
	}

	/**
	 * Literal function
	 * 
	 * Prints a string representation of a matrix, suitable for storing
	 * the value or debugging.
	 * 
	 * @return string A string representation of the matrix, same as the constructor accepts
	 */
	public function literal() {
		$literal = "[";

		for ($i = 1; $i <= $this->getRows(); $i++) {
			for ($j = 1; $j <= $this->getColumns(); $j++) {
				$literal .= $this->getElement($i, $j).',';				
			}
			$literal = substr($literal, 0, strlen($literal) - 1).";";
		}
		$literal = substr($literal, 0, strlen($literal) - 1)."]";

		return $literal;
	}

	/**
	 * Power function
	 * 
	 * Raises the matrix to the $power power.
	 * Logically like pow($matrix, $power)
	 * 
	 * @param float $power The power to which to raise the matrix.
	 * @return matrix The matrix to the $power power
	 */
	public function pow($power) {
		$this->checkSquare($this);

		$newMatrix = self::identity($this->getRows());

		for ($i = 0; $i < $power; $i++) $newMatrix = $newMatrix->dotMultiply($this);

		return $newMatrix;
	}
	
	/**
	 * Reduce function
	 * 
	 * Returns a matrix with the selected row and column removed, useful for
	 * calculating determinants or other recursive operations on matrices.
	 * 
	 * @param int $row Row to remove, null to remove no row
	 * @param int $column Column to remove, null to remove no column
	 * @return matrix A new, smaller matrix
	 */
	public function reduce($row = null, $column = null) {
		$literal = "[";

		for ($i = 1; $i <= $this->getRows(); $i++) {
			if ($i == $row) continue;
			for ($j = 1; $j <= $this->getColumns(); $j++) {
				if ($j == $column) continue;
				$literal .= $this->getElement($i, $j).',';				
			}
			$literal = substr($literal, 0, strlen($literal) - 1).";";
		}
		$literal = substr($literal, 0, strlen($literal) - 1)."]";

		return new Matrix($literal);
	}

	/**
	 * Scalar Multiply function
	 * 
	 * Multiplies this matrix against a scalar value
	 * 
	 * @param float $scalar The scalar value
	 * @return matrix The multiplied matrix
	 */
	public function scalarMultiply($scalar) {
		$rows = $this->getRows();
		$columns = $this->getColumns();
		$newMatrix = Matrix::zero($rows, $columns);

		for ($i = 1; $i <= $rows; $i++) {
			for ($j = 1; $j <= $columns; $j++) {
				$newMatrix->setElement($i, $j, $this->getElement($i, $j) * $scalar);
			}
		}

		return $newMatrix;
	}

	/**
	 * Set Element function
	 * 
	 * Sets the matrix element at the specified location.
	 * 
	 * @param int $row The row in the matrix to set
	 * @param int $column The column in the matrix to set
	 */
	public function setElement($row, $column, $value) {
		$this->matrix[$row - 1][$column - 1] = $value;
	}

	/**
	 * Subtract function
	 * 
	 * Subtracts a matrix from the current matrix
	 * 
	 * @param matrix $matrixB The matrix to subtract
	 * @return matrix The subtracted matrix
	 */
	public function subtract(Matrix $matrixB) {
		$this->sizeCheck($this, $matrixB);

		$rows = $this->getRows();
		$columns = $this->getColumns();
		$newMatrix = Matrix::zero($rows, $columns);

		for ($i = 1; $i <= $rows; $i++) {
			for ($j = 1; $j <= $columns; $j++) {
				$newMatrix->setElement($i, $j, $this->getElement($i, $j) - $matrixB->getElement($i, $j));
			}
		}

		return $newMatrix;
	}

	/**
	 * Trace function
	 * 
	 * Returns the trace of a square matrix
	 * 
	 * @return float The matrix's trace
	 */
	public function trace() {
		$this->checkSquare($this);

		$trace = 0;
		for ($i = 1; $i <= $this->getRows(); $i++) {
			$trace += $this->getElement($i, $i);
		}
		return $trace;
	}

	/**
	 * Transpose function
	 * 
	 * Returns the transpose of the matrix
	 * 
	 * @return matrix The matrix's transpose
	 */
	public function transpose() {
		$rows = $this->getRows();
		$columns = $this->getColumns();
		$newMatrix = Matrix::zero($columns, $rows);

		for ($i = 1; $i <= $rows; $i++) {
			for ($j = 1; $j <= $columns; $j++) {
				$newMatrix->setElement($j, $i, $this->getElement($i, $j));
			}
		}

		return $newMatrix;
	}

	/**
	 * Identity function
	 * 
	 * Returns an identity matrix of the specified size
	 * 
	 * @param int $rows The number of rows in the matrix
	 * @param int $columns The number of columns in the matrix
	 * @return matrix An identity matrix of the specified size
	 * @static
	 */
	static public function identity($size) {
		$literal = "[";

		for ($i = 0; $i < $size; $i++) {
			for ($j = 0; $j < $size; $j++) {
				if ($i == $j) $literal .= "1,";
				else $literal .= "0,";
			}
			$literal = substr($literal, 0, strlen($literal) - 1).";";
		}

		$literal = substr($literal, 0, strlen($literal) - 1)."]";
		return new Matrix($literal);
	}

	/**
	 * Uniform function
	 * 
	 * Returns a matrix consisting entirely of the supplied value
	 * 
	 * @param int $rows The number of rows in the matrix
	 * @param int $columns The number of columns in the matrix
	 * @param float $value The value with which to fill the matrix
	 * @return matrix A matrix filled with elements of value $value
	 * @static
	 */
	static public function uniform($rows, $columns, $value = 0) {
		$literal = "[";

		for ($i = 0; $i < $rows; $i++) {
			for ($j = 0; $j < $columns; $j++) {
				$literal .= "0,";
			}
			$literal = substr($literal, 0, strlen($literal) - 1).";";
		}

		$literal = substr($literal, 0, strlen($literal) - 1)."]";
		return new Matrix($literal);
	}

	/**
	 * Zero function
	 * 
	 * Returns a matrix consisting entirely of zeroes
	 * 
	 * @param int $rows The number of rows in the matrix
	 * @param int $columns The number of columns in the matrix
	 * @return matrix A matrix filled with zero-valued elements
	 * @static
	 */
	static public function zero($rows, $columns) { return self::uniform($rows, $columns, 0); }

	/**
	 * One function
	 * 
	 * Returns a matrix consisting entirely of ones
	 * 
	 * @param int $rows The number of rows in the matrix
	 * @param int $columns The number of columns in the matrix
	 * @return matrix A matrix filled with elements of value one
	 * @static
	 */
	static public function one($rows, $columns) { return self::uniform($rows, $columns, 1); }
}

class MatrixException extends \Exception {
	//Intentionally left empty
}